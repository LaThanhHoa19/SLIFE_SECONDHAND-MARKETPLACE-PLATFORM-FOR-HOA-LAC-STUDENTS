package com.slife.marketplace.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.util.TimeZones;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Email giao dịch (welcome, offer, deal, nhắc giờ giao). Gửi bất đồng bộ; lỗi SMTP chỉ ghi log.
 */
@Service
public class SystemEmailService {

    private static final Logger log = LoggerFactory.getLogger(SystemEmailService.class);
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final ConfigService configService;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@slife.local}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.transport:smtp}")
    private String mailTransport;

    @Value("${app.mail.http.url:}")
    private String mailHttpUrl;

    @Value("${app.mail.http.secret:}")
    private String mailHttpSecret;

    /** Khi non-blank, mọi lệnh gửi mail dùng địa chỉ này (thử template an toàn khi DB có nhiều user). */
    @Value("${app.mail.force-to:}")
    private String mailForceTo;

    public SystemEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            UserRepository userRepository,
            ObjectMapper objectMapper,
            ConfigService configService) {
        this.mailSenderProvider = mailSenderProvider;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.configService = configService;
    }

    @Async("emailTaskExecutor")
    public void trySendWelcomeAfterGoogleLogin(Long userId) {
        if (userId == null || !mailEnabled) {
            return;
        }
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getWelcomeEmailSentAt() != null) {
                return;
            }
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                return;
            }
            String name = displayName(user);
            String subject = "[SLIFE] Chào mừng — tài khoản của bạn đã sẵn sàng";
            String body = buildWelcomeEmailDocument(name);
            send(user.getEmail(), subject, body);
            user.setWelcomeEmailSentAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } catch (Exception ex) {
            log.warn("trySendWelcomeAfterGoogleLogin failed userId={}: {}", userId, ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendOfferProposalEmail(User seller, String buyerName, String listingTitle, Long listingId,
                                       BigDecimal amount) {
        if (!mailEnabled || seller == null || seller.getEmail() == null || seller.getEmail().isBlank()) {
            return;
        }
        try {
            String subject = "Có lượt trả giá mới cho tin của bạn";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                            + "<p><strong>" + esc(buyerName) + "</strong> vừa đề xuất giá <strong>"
                            + esc(formatMoney(amount)) + "</strong> cho tin «" + esc(trunc(listingTitle, 80)) + "».</p>"
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Xem tin & phản hồi</a></p>");
            send(seller.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendOfferProposalEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendOfferAcceptedEmails(User buyer, User seller, String listingTitle, Long listingId,
                                        Long conversationId, Long dealId) {
        if (!mailEnabled) {
            return;
        }
        String title = trunc(listingTitle, 80);
        String chatLink = esc(chatOrListingUrl(listingId, conversationId));
        String listingLink = esc(listingUrl(listingId));
        try {
            if (buyer != null && buyer.getEmail() != null && !buyer.getEmail().isBlank()) {
                String subject = "[SLIFE] Người bán đã chấp nhận trả giá — " + trunc(title, 45);
                String body = buildOfferAcceptedEmailDocument(
                        buyer, seller, title, listingId, dealId, chatLink, listingLink, true);
                send(buyer.getEmail(), subject, body);
            }
            if (seller != null && seller.getEmail() != null && !seller.getEmail().isBlank()) {
                String subject2 = "[SLIFE] Bạn đã chấp nhận một lượt trả giá — " + trunc(title, 40);
                String body2 = buildOfferAcceptedEmailDocument(
                        buyer, seller, title, listingId, dealId, chatLink, listingLink, false);
                send(seller.getEmail(), subject2, body2);
            }
        } catch (Exception ex) {
            log.warn("sendOfferAcceptedEmails failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendOfferRejectedEmails(User buyer, User seller, String listingTitle, Long listingId, BigDecimal amount) {
        if (!mailEnabled) {
            return;
        }
        String title = trunc(listingTitle, 80);
        String money = esc(formatMoney(amount));
        String listingLink = esc(listingUrl(listingId));
        try {
            if (buyer != null && buyer.getEmail() != null && !buyer.getEmail().isBlank()) {
                String subject = "[SLIFE] Trả giá chưa được chấp nhận — " + trunc(title, 40);
                String body = buildOfferRejectedEmailDocument(
                        buyer, seller, title, money, listingLink, true);
                send(buyer.getEmail(), subject, body);
            }
            if (seller != null && seller.getEmail() != null && !seller.getEmail().isBlank()) {
                String subject2 = "[SLIFE] Bạn đã từ chối một lượt trả giá — " + trunc(title, 40);
                String body2 = buildOfferRejectedEmailDocument(
                        buyer, seller, title, money, listingLink, false);
                send(seller.getEmail(), subject2, body2);
            }
        } catch (Exception ex) {
            log.warn("sendOfferRejectedEmails failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendDealStatusChangedEmail(User recipient, Deal deal, String listingTitle, Long listingId,
                                           String headlineForRecipient, User actor) {
        if (!mailEnabled || recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            return;
        }
        try {
            String title = trunc(listingTitle, 80);
            String subject = "[SLIFE] Giao dịch #" + deal.getId() + " — " + trunc(headlineForRecipient, 55);
            String body = buildDealStatusEmailDocument(recipient, deal, title, listingId, headlineForRecipient, actor);
            send(recipient.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendDealStatusChangedEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendAdminUserStatusChangedEmail(User targetUser, String newStatus) {
        if (!mailEnabled || targetUser == null || targetUser.getEmail() == null || targetUser.getEmail().isBlank()) {
            return;
        }
        try {
            String normalized = newStatus != null ? newStatus.trim().toUpperCase() : "UNKNOWN";
            String subject = "Cập nhật trạng thái tài khoản SLIFE";
            String actionText = "ACTIVE".equals(normalized)
                    ? "đã được kích hoạt lại"
                    : ("BANNED".equals(normalized) ? "đã bị khóa" : "đã được cập nhật");
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(targetUser)) + ",</p>"
                            + "<p>Tài khoản SLIFE của bạn " + actionText + ".</p>"
                            + "<p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên.</p>"
                            + "<p><a href=\"" + esc(frontendUrl) + "\">Mở SLIFE</a></p>");
            send(targetUser.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendAdminUserStatusChangedEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendReportApprovedListingModerationEmail(User owner, Long reportId, String listingTitle,
                                                         Long listingId, int violationCount, int threshold,
                                                         boolean autoBanned, String reason) {
        if (!mailEnabled || owner == null || owner.getEmail() == null || owner.getEmail().isBlank()) return;
        try {
            String subject = autoBanned
                    ? "[SLIFE] Tin vi phạm đã bị ẩn và tài khoản của bạn đã bị khóa"
                    : "[SLIFE] Tin vi phạm đã bị ẩn bởi quản trị viên";
            String reasonLine = (reason != null && !reason.isBlank())
                    ? "<p>Lý do xử lý: <strong>" + esc(reason.trim()) + "</strong></p>"
                    : "";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(owner)) + ",</p>"
                            + "<p>Báo cáo #" + (reportId != null ? reportId : "?")
                            + " đã được <strong>duyệt</strong>. Tin đăng của bạn đã bị ẩn: <strong>" + esc(trunc(listingTitle, 90)) + "</strong>.</p>"
                            + reasonLine
                            + "<p>Điểm vi phạm hiện tại: <strong>" + violationCount + " / " + threshold + "</strong>.</p>"
                            + (autoBanned
                            ? "<p>Tài khoản của bạn đã bị <strong>khóa tự động</strong> do đạt ngưỡng vi phạm.</p>"
                            : "<p>Vui lòng tuân thủ quy định cộng đồng để tránh bị khóa tài khoản ở các lần vi phạm tiếp theo.</p>")
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Xem tin đăng</a></p>");
            send(owner.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendReportApprovedListingModerationEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendReportApprovedUserModerationEmail(User targetUser, Long reportId, int violationCount,
                                                      int threshold, boolean bannedNow, String reason) {
        if (!mailEnabled || targetUser == null || targetUser.getEmail() == null || targetUser.getEmail().isBlank()) return;
        try {
            String subject = bannedNow
                    ? "[SLIFE] Báo cáo vi phạm được duyệt — tài khoản đã bị khóa"
                    : "[SLIFE] Báo cáo vi phạm được duyệt";
            String reasonLine = (reason != null && !reason.isBlank())
                    ? "<p>Lý do xử lý: <strong>" + esc(reason.trim()) + "</strong></p>"
                    : "";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(targetUser)) + ",</p>"
                            + "<p>Báo cáo #" + (reportId != null ? reportId : "?") + " về tài khoản của bạn đã được <strong>duyệt</strong>.</p>"
                            + reasonLine
                            + "<p>Điểm vi phạm hiện tại: <strong>" + violationCount + " / " + threshold + "</strong>.</p>"
                            + (bannedNow
                            ? "<p>Tài khoản của bạn đã bị <strong>khóa</strong> do đạt ngưỡng vi phạm.</p>"
                            : "<p>Tài khoản của bạn hiện vẫn hoạt động, nhưng đã bị ghi nhận vi phạm. Vui lòng tuân thủ quy định cộng đồng.</p>")
                            + "<p><a href=\"" + esc(frontendUrl) + "\">Mở SLIFE</a></p>");
            send(targetUser.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendReportApprovedUserModerationEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendListingExpiringSoonEmail(User seller, String listingTitle, Long listingId, LocalDateTime expiresAt) {
        if (!mailEnabled || seller == null || seller.getEmail() == null || seller.getEmail().isBlank()) {
            return;
        }
        try {
            String subject = "Tin đăng của bạn sắp hết hạn";
            String expireStr = expiresAt != null ? expiresAt.format(DT_FMT) : "sắp tới";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                            + "<p>Tin «" + esc(trunc(listingTitle, 80)) + "» sẽ hết hạn vào <strong>" + esc(expireStr) + "</strong>.</p>"
                            + "<p>Bạn có thể gia hạn hoặc đăng lại để tiếp tục hiển thị.</p>"
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Mở tin đăng</a></p>");
            send(seller.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendListingExpiringSoonEmail failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendListingExpiredEmail(User seller, String listingTitle, Long listingId) {
        if (!mailEnabled || seller == null || seller.getEmail() == null || seller.getEmail().isBlank()) {
            return;
        }
        try {
            String subject = "Tin đăng của bạn đã hết hạn";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                            + "<p>Tin «" + esc(trunc(listingTitle, 80)) + "» đã hết hạn hiển thị.</p>"
                            + "<p>Bạn có thể đăng lại tin để tiếp tục bán.</p>"
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Xem tin đăng</a></p>");
            send(seller.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendListingExpiredEmail failed: {}", ex.getMessage());
        }
    }

    /**
     * Dev: gửi tuần tự các template email (welcome, trả giá, deal, nhắc nhận hàng, …) để kiểm tra SMTP/HTTP relay.
     * Đích thực tế = {@code app.mail.force-to} nếu có, không thì tới các email giả lập (không tồn tại trong DB).
     */
    public int sendDevMailSamples() {
        if (!mailEnabled) {
            log.warn("sendDevMailSamples: mail disabled");
            return 0;
        }
        int sent = 0;
        User buyer = devUser(9001L, "buyer-mail-sample@slife.test", "Người mua (mẫu)");
        User seller = devUser(9002L, "seller-mail-sample@slife.test", "Người bán (mẫu)");
        Listing listing = new Listing();
        listing.setId(7001L);
        listing.setTitle("Tai nghe không dây — mẫu test email SLIFE");
        listing.setSeller(seller);
        Deal deal = new Deal();
        deal.setId(5001L);
        deal.setListing(listing);
        deal.setBuyer(buyer);
        deal.setDealPrice(new BigDecimal("199000.00"));
        deal.setStatus("CONFIRMED");
        deal.setPickupTime(LocalDateTime.now(TimeZones.VIETNAM).plusDays(1).withHour(15).withMinute(0).withSecond(0).withNano(0));
        String title = trunc(listing.getTitle(), 80);
        Long listingId = listing.getId();
        try {
            send("welcome-sample@slife.test",
                    "[SLIFE] Chào mừng — tài khoản của bạn đã sẵn sàng",
                    buildWelcomeEmailDocument("Bạn đọc email test"));
            sent++;

            send(seller.getEmail(),
                    "Có lượt trả giá mới cho tin của bạn",
                    htmlWrap("<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                            + "<p><strong>" + esc(displayName(buyer)) + "</strong> vừa đề xuất giá <strong>"
                            + esc(formatMoney(new BigDecimal("150000"))) + "</strong> cho tin «" + esc(title) + "».</p>"
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Xem tin & phản hồi</a></p>"));
            sent++;

            String chatLink = esc(chatOrListingUrl(listingId, 4001L));
            String listingLink = esc(listingUrl(listingId));
            send(buyer.getEmail(),
                    "[SLIFE] Người bán đã chấp nhận trả giá — " + trunc(title, 45),
                    buildOfferAcceptedEmailDocument(buyer, seller, title, listingId, 5001L, chatLink, listingLink, true));
            sent++;
            send(seller.getEmail(),
                    "[SLIFE] Bạn đã chấp nhận một lượt trả giá — " + trunc(title, 40),
                    buildOfferAcceptedEmailDocument(buyer, seller, title, listingId, 5001L, chatLink, listingLink, false));
            sent++;

            String money = esc(formatMoney(new BigDecimal("120000")));
            send(buyer.getEmail(),
                    "[SLIFE] Trả giá chưa được chấp nhận — " + trunc(title, 40),
                    buildOfferRejectedEmailDocument(buyer, seller, title, money, listingLink, true));
            sent++;
            send(seller.getEmail(),
                    "[SLIFE] Bạn đã từ chối một lượt trả giá — " + trunc(title, 40),
                    buildOfferRejectedEmailDocument(buyer, seller, title, money, listingLink, false));
            sent++;

            send(buyer.getEmail(),
                    "[SLIFE] Giao dịch #" + deal.getId() + " — " + trunc("Người bán đã xác nhận giao dịch.", 55),
                    buildDealStatusEmailDocument(buyer, deal, title, listingId,
                            "Người bán đã xác nhận giao dịch — kiểm tra lịch nhận hàng trên SLIFE.", seller));
            sent++;
            send(seller.getEmail(),
                    "[SLIFE] Giao dịch #" + deal.getId() + " — " + trunc("Bạn đã xác nhận giao dịch.", 55),
                    buildDealStatusEmailDocument(seller, deal, title, listingId, "Bạn đã xác nhận giao dịch.", seller));
            sent++;

            String pickupStr = deal.getPickupTime().format(DT_FMT);
            String approxRemaining = formatApproxRemainingToPickup(deal.getPickupTime());
            String subRem = "[SLIFE] Nhắc nhận hàng — #" + deal.getId() + " — " + trunc(title, 50);
            send(buyer.getEmail(), subRem,
                    buildPickupReminderEmailDocument(deal, listing, buyer, seller, true, pickupStr, approxRemaining));
            sent++;
            send(seller.getEmail(), subRem,
                    buildPickupReminderEmailDocument(deal, listing, seller, buyer, false, pickupStr, approxRemaining));
            sent++;

            log.info("sendDevMailSamples: queued {} messages (force-to={})", sent,
                    mailForceTo != null && !mailForceTo.isBlank() ? mailForceTo : "(none)");
        } catch (Exception ex) {
            log.warn("sendDevMailSamples failed: {}", ex.getMessage(), ex);
        }
        return sent;
    }

    private static User devUser(Long id, String email, String fullName) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName(fullName);
        return u;
    }

    private String resolveRecipient(String intendedTo) {
        if (mailForceTo != null && !mailForceTo.isBlank()) {
            String t = mailForceTo.trim();
            if (!t.equalsIgnoreCase(intendedTo != null ? intendedTo.trim() : "")) {
                log.debug("app.mail.force-to: redirect {} -> {}", intendedTo, t);
            }
            return t;
        }
        return intendedTo;
    }

    /** Đồng bộ — gọi từ scheduler sau khi đã chọn deal (tránh đánh dấu reminderSent trước khi gửi). */
    public void sendPickupReminderEmails(Deal deal) {
        if (!mailEnabled || deal == null) {
            return;
        }
        Listing listing = deal.getListing();
        User buyer = deal.getProposedBy();
        User seller = listing != null && listing.getSeller() != null ? listing.getSeller() : null;
        LocalDateTime pickup = deal.getPickupTime();
        if (pickup == null || buyer == null || seller == null) {
            return;
        }
        String pickupStr = pickup.format(DT_FMT);
        String titleShort = listing.getTitle() != null ? trunc(listing.getTitle(), 80) : "tin đăng";
        String approxRemaining = formatApproxRemainingToPickup(pickup);
        String subject = "[SLIFE] Nhắc nhận hàng — #" + deal.getId() + " — " + trunc(titleShort, 50);
        try {
            if (buyer.getEmail() != null && !buyer.getEmail().isBlank()) {
                String body = buildPickupReminderEmailDocument(
                        deal, listing, buyer, seller, true, pickupStr, approxRemaining);
                send(buyer.getEmail(), subject, body);
            }
            if (seller.getEmail() != null && !seller.getEmail().isBlank()) {
                String body = buildPickupReminderEmailDocument(
                        deal, listing, seller, buyer, false, pickupStr, approxRemaining);
                send(seller.getEmail(), subject, body);
            }
        } catch (Exception ex) {
            log.warn("sendPickupReminderEmails dealId={}: {}", deal.getId(), ex.getMessage());
        }
    }

    /**
     * Ước lượng thời gian còn lại đến {@code pickup} (cùng quy ước giờ VN với cột deal).
     * Email gửi theo cron nên lệch vài phút so với thực tế — không cần độ chính xác tuyệt đối.
     */
    private String formatApproxRemainingToPickup(LocalDateTime pickup) {
        if (pickup == null) {
            return "—";
        }
        LocalDateTime now = LocalDateTime.now(TimeZones.VIETNAM);
        Duration d = Duration.between(now, pickup);
        long minutes = d.toMinutes();
        if (minutes <= 0L) {
            return "vài phút";
        }
        if (minutes < 60L) {
            return minutes + " phút";
        }
        long h = minutes / 60L;
        long m = minutes % 60L;
        if (m == 0L) {
            return h == 1L ? "1 giờ" : h + " giờ";
        }
        if (m < 15L) {
            return h + " giờ";
        }
        return h + " giờ " + m + " phút";
    }

    /**
     * HTML email (table + inline CSS) cho nhắc lịch nhận hàng — tương thích client phổ biến.
     */
    private String buildPickupReminderEmailDocument(
            Deal deal,
            Listing listing,
            User recipient,
            User otherParty,
            boolean recipientIsBuyer,
            String pickupStr,
            String approxRemainingPhrase) {
        Long listingId = listing.getId();
        String listingLink = esc(listingUrl(listingId));
        String chatLink = esc(chatOrListingUrl(listingId, null));
        String title = listing.getTitle() != null ? trunc(listing.getTitle(), 120) : "Tin đăng";
        String roleLine = recipientIsBuyer
                ? "Bạn là <strong>người mua</strong> trong giao dịch này."
                : "Bạn là <strong>người bán</strong> trong giao dịch này.";
        String otherLabel = recipientIsBuyer ? "Người bán" : "Người mua";

        String rows = ""
                + emailDetailRow("Mã giao dịch", "#" + deal.getId())
                + emailDetailRow("Tin đăng", esc(title))
                + emailDetailRow("Giá thỏa thuận", esc(formatMoney(deal.getDealPrice())))
                + emailDetailRow("Giờ nhận hàng (dự kiến)", esc(pickupStr))
                + emailDetailRow(otherLabel, esc(displayName(otherParty)))
                + emailDetailRow("Nhắc trước", "Còn khoảng " + esc(approxRemainingPhrase));

        String bodyContent = ""
                + "<p style=\"margin:0 0 16px 0;\">Xin chào <strong>" + esc(displayName(recipient)) + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px 0;\">" + roleLine + "</p>"
                + "<p style=\"margin:0 0 20px 0;color:#475569;\">"
                + "Thời điểm nhận hàng đã gần. Dưới đây là chi tiết giao dịch — vui lòng liên hệ "
                + esc(otherLabel.toLowerCase()) + " nếu cần đổi lịch.</p>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"border-collapse:collapse;font-size:14px;color:#334155;\">"
                + rows
                + "</table>"
                + emailPrimarySecondaryActions(listingLink, chatLink, "Xem tin đăng", "Mở trò chuyện");

        String footer = "Đây là email tự động từ SLIFE. Bạn nhận được vì có giao dịch đang chờ nhận hàng. "
                + "Không cần trả lời trực tiếp email này.";
        return slifeEmailDocument("Nhắc lịch nhận hàng", bodyContent, footer);
    }

    private String buildWelcomeEmailDocument(String displayNameForGreeting) {
        String feed = esc(welcomeAppLink());
        String body = ""
                + "<p style=\"margin:0 0 16px 0;\">Xin chào <strong>" + esc(displayNameForGreeting) + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px 0;color:#475569;\">"
                + "Tài khoản SLIFE của bạn đã được kích hoạt qua Google. "
                + "Bạn có thể đăng tin, trả giá và trao đổi an toàn trên chợ đồ cũ khu Hòa Lạc.</p>"
                + "<ul style=\"margin:0 0 20px 18px;padding:0;color:#334155;font-size:14px;line-height:1.6;\">"
                + "<li>Đăng bán đồ dùng, sách, điện tử…</li>"
                + "<li>Chat trực tiếp với người mua / bán</li>"
                + "<li>Nhận thông báo khi có lượt trả giá hoặc cập nhật giao dịch</li>"
                + "</ul>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:8px;\">"
                + "<tr><td align=\"center\" style=\"padding:6px 0;\">"
                + "<a href=\"" + feed + "\" style=\"display:inline-block;background:#7c3aed;color:#ffffff;"
                + "text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:999px;\">"
                + "Khám phá bảng tin</a>"
                + "</td></tr></table>";
        String footer = "Đây là email chào mừng từ SLIFE. Nếu bạn không vừa đăng nhập, vui lòng bảo mật tài khoản Google.";
        return slifeEmailDocument("Chào mừng đến với SLIFE", body, footer);
    }

    private String buildOfferAcceptedEmailDocument(
            User buyer,
            User seller,
            String titleTruncated,
            Long listingId,
            Long dealId,
            String chatLinkEscaped,
            String listingLinkEscaped,
            boolean recipientIsBuyer) {
        User recipient = recipientIsBuyer ? buyer : seller;
        User other = recipientIsBuyer ? seller : buyer;
        String intro = recipientIsBuyer
                ? ("Người bán <strong>" + esc(displayName(seller)) + "</strong> đã <strong>chấp nhận</strong> "
                + "mức giá bạn đề xuất cho tin dưới đây.")
                : ("Bạn đã <strong>chấp nhận</strong> trả giá của <strong>" + esc(displayName(buyer)) + "</strong>. "
                + "Hãy thống nhất thời gian giao nhận trong chat nếu cần.");
        String rows = emailDetailRow("Tin đăng", esc(titleTruncated));
        if (dealId != null) {
            rows += emailDetailRow("Mã giao dịch", "#" + dealId);
        }
        rows += emailDetailRow("Đối phương", esc(displayName(other)));

        String body = ""
                + "<p style=\"margin:0 0 16px 0;\">Xin chào <strong>" + esc(displayName(recipient)) + "</strong>,</p>"
                + "<p style=\"margin:0 0 18px 0;color:#475569;\">" + intro + "</p>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"border-collapse:collapse;font-size:14px;color:#334155;\">"
                + rows
                + "</table>"
                + emailPrimarySecondaryActions(listingLinkEscaped, chatLinkEscaped, "Xem tin đăng", "Mở trò chuyện");
        String footer = "Email tự động từ SLIFE về lượt trả giá. Không cần trả lời trực tiếp email này.";
        return slifeEmailDocument("Trả giá được chấp nhận", body, footer);
    }

    private String buildOfferRejectedEmailDocument(
            User buyer,
            User seller,
            String titleTruncated,
            String amountEscaped,
            String listingLinkEscaped,
            boolean recipientIsBuyer) {
        User recipient = recipientIsBuyer ? buyer : seller;
        String intro = recipientIsBuyer
                ? ("Người bán <strong>" + esc(displayName(seller)) + "</strong> đã <strong>từ chối</strong> "
                + "mức giá " + amountEscaped + " cho tin dưới đây. Bạn có thể đề xuất mức khác hoặc thảo luận trong chat.")
                : ("Bạn đã <strong>từ chối</strong> mức giá " + amountEscaped + " từ <strong>"
                + esc(displayName(buyer)) + "</strong> cho tin dưới đây.");
        String rows = ""
                + emailDetailRow("Tin đăng", esc(titleTruncated))
                + emailDetailRow("Mức giá đề xuất", amountEscaped)
                + emailDetailRow("Người mua", esc(displayName(buyer)));

        String body = ""
                + "<p style=\"margin:0 0 16px 0;\">Xin chào <strong>" + esc(displayName(recipient)) + "</strong>,</p>"
                + "<p style=\"margin:0 0 18px 0;color:#475569;\">" + intro + "</p>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"border-collapse:collapse;font-size:14px;color:#334155;\">"
                + rows
                + "</table>"
                + emailPrimarySecondaryActions(listingLinkEscaped, null, "Xem tin đăng", null);
        String footer = "Email tự động từ SLIFE. Không cần trả lời trực tiếp email này.";
        return slifeEmailDocument("Cập nhật lượt trả giá", body, footer);
    }

    private String buildDealStatusEmailDocument(
            User recipient,
            Deal deal,
            String titleTruncated,
            Long listingId,
            String headlineForRecipient,
            User actor) {
        String listingLink = esc(listingUrl(listingId));
        String chatLink = esc(chatOrListingUrl(listingId, null));
        String rows = ""
                + emailDetailRow("Mã giao dịch", "#" + deal.getId())
                + emailDetailRow("Tin đăng", esc(titleTruncated))
                + emailDetailRow("Giá thỏa thuận", esc(formatMoney(deal.getDealPrice())))
                + emailDetailRow("Trạng thái trong hệ thống", esc(dealStatusDisplayVi(deal.getStatus())));
        if (deal.getPickupTime() != null) {
            rows += emailDetailRow("Giờ nhận hàng (nếu có)", esc(deal.getPickupTime().format(DT_FMT)));
        }
        String actorLine = "";
        if (shouldShowActor(recipient, actor)) {
            actorLine = "<p style=\"margin:16px 0 0 0;color:#475569;font-size:14px;\">Người thực hiện thao tác: <strong>"
                    + esc(displayName(actor)) + "</strong></p>";
        }

        String body = ""
                + "<p style=\"margin:0 0 16px 0;\">Xin chào <strong>" + esc(displayName(recipient)) + "</strong>,</p>"
                + "<p style=\"margin:0 0 8px 0;font-size:16px;color:#0f172a;font-weight:600;line-height:1.45;\">"
                + esc(headlineForRecipient) + "</p>"
                + "<p style=\"margin:0 0 18px 0;color:#475569;\">Dưới đây là thông tin giao dịch trên SLIFE.</p>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"border-collapse:collapse;font-size:14px;color:#334155;\">"
                + rows
                + "</table>"
                + actorLine
                + emailPrimarySecondaryActions(listingLink, chatLink, "Xem tin đăng", "Mở trò chuyện");
        String footer = "Email tự động từ SLIFE về giao dịch của bạn. Không cần trả lời trực tiếp email này.";
        return slifeEmailDocument("Cập nhật giao dịch", body, footer);
    }

    private static boolean shouldShowActor(User recipient, User actor) {
        if (actor == null || recipient == null) {
            return false;
        }
        if (actor.getId() == null || recipient.getId() == null) {
            return false;
        }
        return !actor.getId().equals(recipient.getId());
    }

    private static String dealStatusDisplayVi(String status) {
        if (status == null) {
            return "—";
        }
        return switch (status.trim().toUpperCase()) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "COMPLETED" -> "Đã chấp nhận (chờ nhận hàng)";
            case "CANCELLED" -> "Đã hủy";
            case "REJECTED" -> "Đã từ chối";
            case "SUCCESS" -> "Hoàn tất";
            default -> status;
        };
    }

    private String slifeEmailDocument(String headerSubtitle, String bodyContentHtml, String footerText) {
        String inner = ""
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background-color:#f4f4f6;margin:0;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:600px;width:100%;background:#ffffff;border-radius:12px;"
                + "overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);\">"
                + "<tr><td style=\"background:#7c3aed;padding:22px 24px;\">"
                + "<div style=\"color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.02em;\">SLIFE</div>"
                + "<div style=\"color:rgba(255,255,255,0.92);font-size:14px;margin-top:6px;\">"
                + esc(headerSubtitle) + "</div>"
                + "</td></tr>"
                + "<tr><td style=\"padding:24px 24px 8px 24px;color:#1e293b;font-size:15px;line-height:1.55;\">"
                + bodyContentHtml
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 24px 22px 24px;background:#f8fafc;font-size:12px;color:#64748b;"
                + "line-height:1.5;border-top:1px solid #e2e8f0;\">"
                + esc(footerText)
                + "</td></tr>"
                + "</table></td></tr></table>";
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>"
                + "<body style=\"margin:0;padding:0;\">" + inner + "</body></html>";
    }

    private String emailPrimarySecondaryActions(String primaryUrlEscaped, String secondaryUrlEscaped,
                                                String primaryLabel, String secondaryLabel) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:24px;\">");
        if (primaryUrlEscaped != null && primaryLabel != null) {
            sb.append("<tr><td align=\"center\" style=\"padding:4px;\">")
                    .append("<a href=\"").append(primaryUrlEscaped)
                    .append("\" style=\"display:inline-block;background:#7c3aed;color:#ffffff;")
                    .append("text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:999px;\">")
                    .append(esc(primaryLabel))
                    .append("</a></td></tr>");
        }
        if (secondaryUrlEscaped != null && secondaryLabel != null) {
            sb.append("<tr><td align=\"center\" style=\"padding:4px;\">")
                    .append("<a href=\"").append(secondaryUrlEscaped)
                    .append("\" style=\"display:inline-block;color:#7c3aed;")
                    .append("text-decoration:underline;font-size:14px;font-weight:600;\">")
                    .append(esc(secondaryLabel))
                    .append("</a></td></tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    private static String emailDetailRow(String label, String valueHtml) {
        return "<tr>"
                + "<td style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;vertical-align:top;width:42%;\">"
                + esc(label) + "</td>"
                + "<td style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;"
                + "color:#0f172a;vertical-align:top;\">" + valueHtml + "</td>"
                + "</tr>";
    }

    /** Trang mặc định sau đăng nhập (email welcome). */
    private String welcomeAppLink() {
        return frontendUrl.replaceAll("/$", "") + "/feed";
    }

    private boolean useHttpRelay() {
        return mailTransport != null && "http".equalsIgnoreCase(mailTransport.trim());
    }

    private void send(String to, String subject, String htmlBody) {
        String toResolved = resolveRecipient(to);
        if (useHttpRelay()) {
            sendViaHttpRelay(toResolved, subject, htmlBody);
            return;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("JavaMailSender bean missing — add spring-boot-starter-mail properties or set app.mail.transport=http. Skip email to {}", toResolved);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(toResolved);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.debug("Email sent (SMTP) to {} subject={}", toResolved, subject);
        } catch (Exception ex) {
            log.warn("send email failed to {}: {}", to, ex.getMessage());
            throw new RuntimeException(ex);
        }
    }

    private void sendViaHttpRelay(String to, String subject, String htmlBody) {
        String url = mailHttpUrl != null ? mailHttpUrl.trim() : "";
        String secret = mailHttpSecret != null ? mailHttpSecret.trim() : "";
        if (url.isEmpty() || secret.isEmpty()) {
            log.warn("app.mail.http.url or app.mail.http.secret empty — skip email to {}", to);
            return;
        }
        try {
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", htmlBody);
            payload.put("from", mailFrom);
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + secret)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
            }
            log.debug("Email sent (HTTP relay) to {} subject={}", to, subject);
        } catch (Exception ex) {
            log.warn("send email via HTTP relay failed to {}: {}", to, ex.getMessage());
            throw new RuntimeException(ex);
        }
    }

    private String listingUrl(Long listingId) {
        if (listingId == null) {
            return frontendUrl;
        }
        return frontendUrl.replaceAll("/$", "") + "/listings/" + listingId;
    }

    private String chatOrListingUrl(Long listingId, Long conversationId) {
        String base = frontendUrl.replaceAll("/$", "");
        if (listingId != null) {
            return base + "/chat?listingId=" + listingId;
        }
        return base;
    }

    private static String htmlWrap(String inner) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body style=\"font-family:sans-serif\">"
                + inner + "</body></html>";
    }

    private static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String trunc(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    private static String displayName(User u) {
        if (u == null) {
            return "bạn";
        }
        if (u.getFullName() != null && !u.getFullName().isBlank()) {
            return u.getFullName().trim();
        }
        if (u.getEmail() != null) {
            return u.getEmail();
        }
        return "bạn";
    }

    private static String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        return amount.toPlainString() + " ₫";
    }
}
