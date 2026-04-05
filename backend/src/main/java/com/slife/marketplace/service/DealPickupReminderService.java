package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Nhắc email 2 bên khi còn khoảng 3 giờ tới {@link Deal#getPickupTime()} (cửa sổ ±7 phút theo chu kỳ cron).
 */
@Service
public class DealPickupReminderService {

    private static final Logger log = LoggerFactory.getLogger(DealPickupReminderService.class);

    private final DealRepository dealRepository;
    private final SystemEmailService systemEmailService;

    @Value("${app.scheduler.pickup-reminder-zone:Asia/Ho_Chi_Minh}")
    private String zoneId;

    public DealPickupReminderService(DealRepository dealRepository, SystemEmailService systemEmailService) {
        this.dealRepository = dealRepository;
        this.systemEmailService = systemEmailService;
    }

    @Transactional
    public void processDueReminders() {
        ZoneId zone = ZoneId.of(zoneId);
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDateTime lower = now.plusHours(3).minusMinutes(7);
        LocalDateTime upper = now.plusHours(3).plusMinutes(7);
        List<Deal> deals = dealRepository.findDealsForPickupReminder(lower, upper);
        for (Deal d : deals) {
            try {
                systemEmailService.sendPickupReminderEmails(d);
                d.setReminderSent(true);
                dealRepository.save(d);
                log.info("Pickup reminder emails queued dealId={}", d.getId());
            } catch (Exception ex) {
                log.warn("Pickup reminder failed dealId={}: {}", d.getId(), ex.getMessage());
            }
        }
    }
}
