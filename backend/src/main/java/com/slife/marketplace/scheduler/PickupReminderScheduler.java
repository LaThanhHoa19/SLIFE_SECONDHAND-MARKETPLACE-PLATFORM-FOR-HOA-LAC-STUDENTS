package com.slife.marketplace.scheduler;

import com.slife.marketplace.service.DealPickupReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Mỗi 5 phút: deal CONFIRMED/COMPLETED có {@code pickup_time} trong khoảng ~PICKUP_REMINDER_HOURS nữa → gửi email 2 bên.
 */
@Component
public class PickupReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(PickupReminderScheduler.class);

    private final DealPickupReminderService dealPickupReminderService;

    public PickupReminderScheduler(DealPickupReminderService dealPickupReminderService) {
        this.dealPickupReminderService = dealPickupReminderService;
    }

    @Scheduled(cron = "${app.scheduler.pickup-reminder-cron:0 */5 * * * *}")
    public void run() {
        try {
            dealPickupReminderService.processDueReminders();
        } catch (Exception ex) {
            log.warn("PickupReminderScheduler failed: {}", ex.getMessage(), ex);
        }
    }
}
