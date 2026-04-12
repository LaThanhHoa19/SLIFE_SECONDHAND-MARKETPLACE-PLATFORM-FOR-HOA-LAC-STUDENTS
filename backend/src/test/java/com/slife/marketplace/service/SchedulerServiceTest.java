package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchedulerServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private ConfigService configService;

    private SchedulerService service;

    @BeforeEach
    void setUp() {
        service = new SchedulerService(dealRepository, configService);
    }

    @Test
    @DisplayName("autoCompleteConfirmedDeals: không quá hạn → không gọi saveAll")
    void noOverdue_noSaveAll() {
        when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(3);
        when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                .thenReturn(List.of());

        service.autoCompleteConfirmedDeals();

        verify(dealRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("autoCompleteConfirmedDeals: clamp timeoutDays >=1")
    void clampTimeoutDays_min1() {
        when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(0);
        when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                .thenReturn(List.of());

        service.autoCompleteConfirmedDeals();

        ArgumentCaptor<LocalDateTime> cap = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(dealRepository).findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), cap.capture());
        LocalDateTime threshold = cap.getValue();

        // Expect threshold ~ now - 1 day
        LocalDateTime now = LocalDateTime.now();
        Duration d = Duration.between(threshold, now);
        assertTrue(d.toHours() >= 23 && d.toHours() <= 25);
    }

    @Test
    @DisplayName("autoCompleteConfirmedDeals: overdue deals → set status COMPLETED + saveAll")
    void overdue_shouldCompleteAndSaveAll() {
        when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(3);
        Deal d1 = new Deal();
        d1.setStatus("CONFIRMED");
        Deal d2 = new Deal();
        d2.setStatus("CONFIRMED");
        when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                .thenReturn(List.of(d1, d2));

        service.autoCompleteConfirmedDeals();

        assertEquals("COMPLETED", d1.getStatus());
        assertEquals("COMPLETED", d2.getStatus());
        verify(dealRepository).saveAll(List.of(d1, d2));
    }
}

