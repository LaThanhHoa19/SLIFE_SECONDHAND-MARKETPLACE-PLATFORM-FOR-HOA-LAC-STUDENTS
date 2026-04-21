package com.slife.marketplace.scheduler;

import com.slife.marketplace.service.DealPickupReminderService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Mỗi 5 phút: deal CONFIRMED/COMPLETED — nhắc trước giờ giao theo config; nếu còn ít hơn H giờ thì gửi bù ngay.
 */
@Component
public class PickupReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(PickupReminderScheduler.class);

    private final DealPickupReminderService dealPickupReminderService;

    public PickupReminderScheduler(DealPickupReminderService dealPickupReminderService) {
        this.dealPickupReminderService = dealPickupReminderService;
    }

    @Scheduled(cron = "${app.scheduler.pickup-reminder-cron:0 */5 * * * *}")
    @SchedulerLock(name = "pickupReminder", lockAtLeastFor = "PT2M", lockAtMostFor = "PT10M")
    public void run() {
        try {
            dealPickupReminderService.processDueReminders();
        } catch (Exception ex) {
            log.warn("PickupReminderScheduler failed: {}", ex.getMessage(), ex);
        }
    }
}
