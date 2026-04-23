package com.slife.marketplace.scheduler;

import com.slife.marketplace.service.DealAutoFinalizeReminderService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Mỗi giờ: quét deal COMPLETED sắp hết hạn auto-finalize → gửi email nhắc buyer xác nhận.
 * Chạy mỗi giờ (phút 30) để tránh trùng với autoFinalizeDeals (1:00 AM) và pickupReminder (mỗi 5 phút).
 */
@Component
public class DealAutoFinalizeReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(DealAutoFinalizeReminderScheduler.class);

    private final DealAutoFinalizeReminderService dealAutoFinalizeReminderService;

    public DealAutoFinalizeReminderScheduler(DealAutoFinalizeReminderService dealAutoFinalizeReminderService) {
        this.dealAutoFinalizeReminderService = dealAutoFinalizeReminderService;
    }

    @Scheduled(cron = "${app.scheduler.auto-finalize-reminder-cron:0 30 * * * *}")
    @SchedulerLock(name = "autoFinalizeReminder", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void run() {
        try {
            dealAutoFinalizeReminderService.processDueReminders();
        } catch (Exception ex) {
            log.warn("DealAutoFinalizeReminderScheduler failed: {}", ex.getMessage(), ex);
        }
    }
}
