package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.util.TimeZones;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SchedulerService {

    private static final Logger log = LoggerFactory.getLogger(SchedulerService.class);
    private static final int DEFAULT_DEAL_TIMEOUT_DAYS = 3;

    private final DealRepository dealRepository;
    private final ConfigService configService;

    public SchedulerService(DealRepository dealRepository, ConfigService configService) {
        this.dealRepository = dealRepository;
        this.configService = configService;
    }

    /**
     * UC-56: Auto confirm completed deals after configurable timeout.
     */
    @Transactional
    @Scheduled(cron = "${app.scheduler.auto-confirm-deal-cron:0 0 * * * *}")
    @SchedulerLock(name = "autoCompleteConfirmedDeals", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void autoCompleteConfirmedDeals() {
        int timeoutValue = Math.max(1, configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", DEFAULT_DEAL_TIMEOUT_DAYS));
        String timeoutUnit = java.util.Objects.requireNonNullElse(
                configService.getConfigValue("DEAL_TIMEOUT_UNIT"), "DAYS").trim().toUpperCase();

        LocalDateTime now = LocalDateTime.now(TimeZones.VIETNAM);
        LocalDateTime threshold = "MINUTES".equals(timeoutUnit)
                ? now.minusMinutes(timeoutValue)
                : now.minusDays(timeoutValue);

        List<Deal> overdueDeals = dealRepository.findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull("CONFIRMED",
                threshold);
        if (overdueDeals.isEmpty()) {
            return;
        }

        for (Deal deal : overdueDeals) {
            deal.setStatus("COMPLETED");
        }
        dealRepository.saveAll(overdueDeals);
        log.info("Auto completed {} deals (timeout={} {})", overdueDeals.size(), timeoutValue, timeoutUnit);
    }
}