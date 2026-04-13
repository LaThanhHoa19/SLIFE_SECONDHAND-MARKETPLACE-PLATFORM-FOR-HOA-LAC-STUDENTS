/**
 * Job: tin ACTIVE quá expirationDate → HIDDEN theo batch (mỗi giờ: cron {@code 0 0 * * * *}).
 * Catalog đã lọc lazy expiry; batch đồng bộ status.
 */
package com.slife.marketplace.scheduler;

import com.slife.marketplace.service.ListingService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExpireListingsScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpireListingsScheduler.class);

    private final ListingService listingService;

    public ExpireListingsScheduler(ListingService listingService) {
        this.listingService = listingService;
    }

    @Scheduled(cron = "${app.scheduler.expire-listing-cron:0 0 * * * *}")
    @SchedulerLock(name = "expireListings", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void run() {
        try {
            listingService.hideExpiredActiveListings();
        } catch (Exception ex) {
            log.warn("ExpireListingsScheduler failed: {}", ex.getMessage(), ex);
        }
    }
}
