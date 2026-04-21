package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchedulerServiceTest {

    @Mock
    private DealRepository dealRepository;
    @Mock
    private ConfigService configService;

    private SchedulerService service;

    @BeforeEach
    void setUp() {
        service = new SchedulerService(dealRepository, configService);
    }

    @Nested
    @DisplayName("Function: autoCompleteConfirmedDeals")
    class AutoCompleteConfirmedDealsGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - overdue deals are marked COMPLETED and persisted")
        void utcId01_shouldCompleteAndPersistOverdueDeals() {
            when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(3);
            when(configService.getConfigValue("DEAL_TIMEOUT_UNIT")).thenReturn("DAYS");

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

        @Test
        @DisplayName("UTCID02 [Positive] - no overdue deal means no saveAll")
        void utcId02_shouldNotSave_whenNoOverdueDeal() {
            when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(3);
            when(configService.getConfigValue("DEAL_TIMEOUT_UNIT")).thenReturn("DAYS");
            when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                    .thenReturn(List.of());

            service.autoCompleteConfirmedDeals();

            verify(dealRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("UTCID03 [Boundary] - timeout days <= 0 is clamped to 1 day")
        void utcId03_shouldClampTimeoutDaysToOne() {
            when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(0);
            when(configService.getConfigValue("DEAL_TIMEOUT_UNIT")).thenReturn("DAYS");
            when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                    .thenReturn(List.of());

            service.autoCompleteConfirmedDeals();

            ArgumentCaptor<LocalDateTime> cap = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(dealRepository).findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), cap.capture());
            LocalDateTime threshold = cap.getValue();
            assertNotNull(threshold);

            LocalDateTime now = LocalDateTime.now();
            Duration d = Duration.between(threshold, now);
            assertTrue(d.toHours() >= 23 && d.toHours() <= 25);
        }

        @Test
        @DisplayName("UTCID04 [Positive] - MINUTES unit uses minute-based threshold")
        void utcId04_shouldUseMinuteThreshold_whenUnitIsMinutes() {
            when(configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 3)).thenReturn(30);
            when(configService.getConfigValue("DEAL_TIMEOUT_UNIT")).thenReturn("MINUTES");
            when(dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), any()))
                    .thenReturn(List.of());

            service.autoCompleteConfirmedDeals();

            ArgumentCaptor<LocalDateTime> cap = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(dealRepository).findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(eq("CONFIRMED"), cap.capture());
            LocalDateTime threshold = cap.getValue();

            LocalDateTime now = LocalDateTime.now();
            Duration d = Duration.between(threshold, now);
            assertTrue(d.toMinutes() >= 29 && d.toMinutes() <= 31);
        }
    }
}

