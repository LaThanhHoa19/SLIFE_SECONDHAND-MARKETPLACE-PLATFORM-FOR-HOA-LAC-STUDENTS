package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealPickupReminderServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private SystemEmailService systemEmailService;
    @Mock private ConfigService configService;

    private DealPickupReminderService service;

    @BeforeEach
    void setUp() {
        service = new DealPickupReminderService(dealRepository, systemEmailService, configService);
        ReflectionTestUtils.setField(service, "zoneId", "UTC");
        when(configService.getIntConfigValue("PICKUP_REMINDER_HOURS", 3)).thenReturn(3);
    }

    @Test
    @DisplayName("processDueReminders: không có deal → không thực hiện")
    void noDeals_noop() {
        when(dealRepository.findDealsForPickupReminder(any(LocalDateTime.class), any(LocalDateTime.class),
                any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        service.processDueReminders();
        verifyNoInteractions(systemEmailService);
        verify(dealRepository, never()).save(any());
    }

    @Test
    @DisplayName("[Thường] processDueReminders: luồng thành công → send email + set reminderSent + save")
    void happyPath_shouldSendAndSave() {
        Deal d = new Deal();
        d.setId(1L);
        d.setReminderSent(false);
        when(dealRepository.findDealsForPickupReminder(any(LocalDateTime.class), any(LocalDateTime.class),
                any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of(d));
        when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> inv.getArgument(0));

        service.processDueReminders();

        verify(systemEmailService).sendPickupReminderEmails(d);
        verify(dealRepository).save(d);
    }

    @Test
    @DisplayName("processDueReminders: 1 deal fail không làm stop các deal khác")
    void oneFail_shouldContinue() {
        Deal d1 = new Deal();
        d1.setId(1L);
        Deal d2 = new Deal();
        d2.setId(2L);
        when(dealRepository.findDealsForPickupReminder(any(LocalDateTime.class), any(LocalDateTime.class),
                any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of(d1, d2));
        doThrow(new RuntimeException("mail")).when(systemEmailService).sendPickupReminderEmails(d1);

        assertDoesNotThrow(() -> service.processDueReminders());

        verify(systemEmailService).sendPickupReminderEmails(d1);
        verify(systemEmailService).sendPickupReminderEmails(d2);
        verify(dealRepository, never()).save(d1);
        verify(dealRepository).save(d2);
    }
}

