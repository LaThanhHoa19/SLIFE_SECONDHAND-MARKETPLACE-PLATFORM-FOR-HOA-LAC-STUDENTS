package com.slife.marketplace.service;

import com.slife.marketplace.repository.ListingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Một đợt expiry = transaction riêng ({@link Propagation#REQUIRES_NEW}) để giảm thời gian khóa,
 * cập nhật theo batch ID cố định.
 */
@Service
@Slf4j
public class ListingExpiryBatchService {

    private final ListingRepository listingRepository;
    private final int batchSize;

    public ListingExpiryBatchService(
            ListingRepository listingRepository,
            @Value("${app.scheduler.expire-listing-batch-size:100}") int batchSize) {
        this.listingRepository = listingRepository;
        this.batchSize = batchSize;
    }

    /**
     * Lấy tối đa {@code batchSize} ID tin ACTIVE đã quá hạn và set {@code HIDDEN}.
     *
     * @return số hàng UPDATE thực sự (0 = hết việc)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int hideNextBatch(Instant now) {
        int size = Math.max(1, Math.min(batchSize, 500));
        List<Long> ids = listingRepository.findIdsOfActiveExpiredListings(now, PageRequest.of(0, size));
        if (ids.isEmpty()) {
            return 0;
        }
        int updated = listingRepository.hideExpiredActiveListingsByIds(ids, now);
        log.info("listing expiry batch: selectedIds={} rowsUpdated={}", ids.size(), updated);
        return updated;
    }
}
