package com.slife.marketplace.service;

import com.slife.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingExpiryBatchServiceTest {

    @Mock private ListingRepository listingRepository;
    @Mock private SystemEmailService systemEmailService;

    private ListingExpiryBatchService service;

    @BeforeEach
    void setUp() {
        service = new ListingExpiryBatchService(listingRepository, systemEmailService, 100);
    }

    @Test
    @DisplayName("hideNextBatch: clamp batchSize min=1")
    void clamp_min1() {
        service = new ListingExpiryBatchService(listingRepository, systemEmailService, 0);
        Instant now = Instant.now();
        when(listingRepository.findIdsOfActiveExpiredListings(eq(now), any(PageRequest.class))).thenReturn(List.of());

        int out = service.hideNextBatch(now);
        assertEquals(0, out);

        ArgumentCaptor<PageRequest> cap = ArgumentCaptor.forClass(PageRequest.class);
        verify(listingRepository).findIdsOfActiveExpiredListings(eq(now), cap.capture());
        assertEquals(1, cap.getValue().getPageSize());
    }

    @Test
    @DisplayName("hideNextBatch: clamp batchSize max=500")
    void clamp_max500() {
        service = new ListingExpiryBatchService(listingRepository, systemEmailService, 9999);
        Instant now = Instant.now();
        when(listingRepository.findIdsOfActiveExpiredListings(eq(now), any(PageRequest.class))).thenReturn(List.of());

        service.hideNextBatch(now);

        ArgumentCaptor<PageRequest> cap = ArgumentCaptor.forClass(PageRequest.class);
        verify(listingRepository).findIdsOfActiveExpiredListings(eq(now), cap.capture());
        assertEquals(500, cap.getValue().getPageSize());
    }

    @Test
    @DisplayName("hideNextBatch: no ids → return 0, không gọi hide")
    void noIds_returns0() {
        Instant now = Instant.now();
        when(listingRepository.findIdsOfActiveExpiredListings(eq(now), any(PageRequest.class))).thenReturn(List.of());

        int out = service.hideNextBatch(now);
        assertEquals(0, out);
        verify(listingRepository, never()).hideExpiredActiveListingsByIds(anyList(), any());
    }

    @Test
    @DisplayName("hideNextBatch: có ids → gọi hide và return updated")
    void hasIds_shouldHideAndReturnUpdated() {
        Instant now = Instant.now();
        List<Long> ids = List.of(1L, 2L, 3L);
        when(listingRepository.findIdsOfActiveExpiredListings(eq(now), any(PageRequest.class))).thenReturn(ids);
        when(listingRepository.hideExpiredActiveListingsByIds(ids, now)).thenReturn(2);

        int out = service.hideNextBatch(now);
        assertEquals(2, out);
        verify(listingRepository).hideExpiredActiveListingsByIds(ids, now);
    }
}

