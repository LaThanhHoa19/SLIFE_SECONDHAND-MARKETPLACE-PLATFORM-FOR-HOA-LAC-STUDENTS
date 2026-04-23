package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.repository.DealRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

/**
 * Gửi email nhắc buyer xác nhận giao dịch trước khi hệ thống tự động hoàn tất (auto-finalize).
 *
 * Logic:
 * - Deal ở trạng thái COMPLETED (seller đã chốt, chờ buyer xác nhận)
 * - Deadline auto-finalize = confirmedAt + DEAL_TIMEOUT_DAYS (hoặc MINUTES)
 * - Gửi reminder trước deadline DEAL_FINALIZE_REMINDER_DAYS (hoặc phút nếu unit=MINUTES)
 * - Chỉ gửi 1 lần (autoFinalizeReminderSent = false → true)
 *
 * Edge cases handled:
 * - confirmedAt = null → skip
 * - DEAL_FINALIZE_REMINDER_DAYS >= DEAL_TIMEOUT_DAYS → skip (vô nghĩa)
 * - DEAL_TIMEOUT_UNIT = MINUTES → tính theo phút
 * - Buyer null / email null / BANNED → skip (trong SystemEmailService)
 * - Email fail → log warn, không rollback (flag đã set trước khi gửi async email)
 */
@Service
public class DealAutoFinalizeReminderService {

    private static final Logger log = LoggerFactory.getLogger(DealAutoFinalizeReminderService.class);

    private final DealRepository dealRepository;
    private final SystemEmailService systemEmailService;
    private final ConfigService configService;

    public DealAutoFinalizeReminderService(DealRepository dealRepository,
                                           SystemEmailService systemEmailService,
                                           ConfigService configService) {
        this.dealRepository = dealRepository;
        this.systemEmailService = systemEmailService;
        this.configService = configService;
    }

    @Transactional
    public void processDueReminders() {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(zone);

        // Đọc config
        int timeoutValue = Math.max(1, configService.getIntConfigValue("DEAL_TIMEOUT_DAYS", 7));
        String timeoutUnit = Objects.requireNonNullElse(
                configService.getConfigValue("DEAL_TIMEOUT_UNIT"), "DAYS").trim().toUpperCase();
        int reminderBefore = Math.max(1, configService.getIntConfigValue("DEAL_FINALIZE_REMINDER_DAYS", 1));

        // Validate: reminder phải nhỏ hơn timeout, nếu không thì vô nghĩa
        if (reminderBefore >= timeoutValue) {
            log.debug("AutoFinalizeReminder: reminderBefore({}) >= timeoutValue({}), skip", reminderBefore, timeoutValue);
            return;
        }

        boolean useMinutes = "MINUTES".equals(timeoutUnit);

        // cutoffReminder: deal có confirmedAt <= cutoffReminder → đã đến lúc nhắc
        // = now - (timeout - reminder) theo unit
        // Ví dụ: timeout=7 days, reminder=1 day → cutoffReminder = now - 6 days
        //   → deal confirmedAt <= (now - 6 days) nghĩa là đã qua 6 ngày → còn 1 ngày nữa hết hạn
        LocalDateTime cutoffReminder = useMinutes
                ? now.minusMinutes(timeoutValue - reminderBefore)
                : now.minusDays(timeoutValue - reminderBefore);

        // cutoffAutoFinalize: deal có confirmedAt <= cutoffAutoFinalize → đã hết hạn (autoFinalizeDeals sẽ xử lý)
        // = now - timeout
        LocalDateTime cutoffAutoFinalize = useMinutes
                ? now.minusMinutes(timeoutValue)
                : now.minusDays(timeoutValue);

        log.info("AutoFinalizeReminder: now={} timeout={}({}) reminder={}({}) cutoffReminder={} cutoffAutoFinalize={}",
                now, timeoutValue, timeoutUnit, reminderBefore, timeoutUnit, cutoffReminder, cutoffAutoFinalize);

        List<Deal> deals = dealRepository.findDealsForAutoFinalizeReminder(cutoffReminder, cutoffAutoFinalize);

        if (deals.isEmpty()) {
            log.debug("AutoFinalizeReminder: no deals to remind");
            return;
        }

        log.info("AutoFinalizeReminder: found {} deal(s) to remind", deals.size());

        for (Deal deal : deals) {
            try {
                // Tính deadline cụ thể cho deal này
                LocalDateTime confirmedAt = deal.getConfirmedAt();
                if (confirmedAt == null) {
                    log.warn("AutoFinalizeReminder: dealId={} has null confirmedAt, skip", deal.getId());
                    continue;
                }

                LocalDateTime deadline = useMinutes
                        ? confirmedAt.plusMinutes(timeoutValue)
                        : confirmedAt.plusDays(timeoutValue);

                // Set flag trước → gửi email async sau
                // Nếu email fail, buyer không nhận được nhưng không gửi trùng lần sau
                // Trade-off chấp nhận: tốt hơn gửi spam nếu email service liên tục fail
                deal.setAutoFinalizeReminderSent(true);
                dealRepository.save(deal);

                // Gửi email async cho buyer
                systemEmailService.sendAutoFinalizeReminderToBuyer(deal, deadline);

                log.info("AutoFinalizeReminder: queued email for dealId={} deadline={}", deal.getId(), deadline);
            } catch (Exception ex) {
                log.warn("AutoFinalizeReminder: failed dealId={}: {}", deal.getId(), ex.getMessage(), ex);
            }
        }
    }
}
