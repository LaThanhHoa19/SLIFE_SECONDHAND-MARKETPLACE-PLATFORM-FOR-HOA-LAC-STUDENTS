package com.slife.marketplace.service;

import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.beans.factory.ObjectProvider;

/**
 * Email giao dịch (welcome, offer, deal, nhắc giờ giao). Gửi bất đồng bộ; lỗi SMTP chỉ ghi log.
 */
@Service
public class SystemEmailService {

    private static final Logger log = LoggerFactory.getLogger(SystemEmailService.class);
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final UserRepository userRepository;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@slife.local}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public SystemEmailService(ObjectProvider<JavaMailSender> mailSenderProvider, UserRepository userRepository) {
        this.mailSenderProvider = mailSenderProvider;
        this.userRepository = userRepository;
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
            String subject = "Chào mừng bạn đến với SLIFE";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(name) + ",</p>"
                            + "<p>Tài khoản SLIFE của bạn đã được kích hoạt qua Google. "
                            + "Bạn có thể đăng tin, trả giá và trao đổi an toàn trên chợ đồ cũ sinh viên.</p>"
                            + "<p><a href=\"" + esc(frontendUrl) + "\">Mở SLIFE</a></p>"
                            + "<p style=\"color:#666;font-size:12px\">Đây là email hệ thống, vui lòng không trả lời.</p>");
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
    public void sendOfferAcceptedEmails(User buyer, User seller, String listingTitle, Long listingId, Long conversationId) {
        if (!mailEnabled) {
            return;
        }
        String title = trunc(listingTitle, 80);
        try {
            if (buyer != null && buyer.getEmail() != null && !buyer.getEmail().isBlank()) {
                String subject = "Người bán đã chấp nhận mức giá bạn đề xuất";
                String body = htmlWrap(
                        "<p>Xin chào " + esc(displayName(buyer)) + ",</p>"
                                + "<p>Người bán đã <strong>chấp nhận</strong> trả giá của bạn cho «" + esc(title) + "».</p>"
                                + "<p><a href=\"" + esc(chatOrListingUrl(listingId, conversationId)) + "\">Mở chat / chi tiết</a></p>");
                send(buyer.getEmail(), subject, body);
            }
            if (seller != null && seller.getEmail() != null && !seller.getEmail().isBlank()) {
                String subject2 = "Bạn đã chấp nhận một lượt trả giá";
                String body2 = htmlWrap(
                        "<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                                + "<p>Bạn đã chấp nhận trả giá của người mua cho «" + esc(title) + "». "
                                + "Hãy chốt thời gian giao dịch trong chat nếu cần.</p>"
                                + "<p><a href=\"" + esc(chatOrListingUrl(listingId, conversationId)) + "\">Mở chat</a></p>");
                send(seller.getEmail(), subject2, body2);
            }
        } catch (Exception ex) {
            log.warn("sendOfferAcceptedEmails failed: {}", ex.getMessage());
        }
    }

    @Async("emailTaskExecutor")
    public void sendOfferRejectedEmail(User buyer, String sellerName, String listingTitle, Long listingId,
                                       BigDecimal amount) {
        if (!mailEnabled || buyer == null || buyer.getEmail() == null || buyer.getEmail().isBlank()) {
            return;
        }
        try {
            String subject = "Lượt trả giá của bạn chưa được chấp nhận";
            String body = htmlWrap(
                    "<p>Xin chào " + esc(displayName(buyer)) + ",</p>"
                            + "<p>Người bán <strong>" + esc(sellerName) + "</strong> đã <strong>từ chối</strong> "
                            + "mức giá " + esc(formatMoney(amount)) + " cho «" + esc(trunc(listingTitle, 80)) + "».</p>"
                            + "<p><a href=\"" + esc(listingUrl(listingId)) + "\">Xem tin</a></p>");
            send(buyer.getEmail(), subject, body);
        } catch (Exception ex) {
            log.warn("sendOfferRejectedEmail failed: {}", ex.getMessage());
        }
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
        String title = listing.getTitle() != null ? trunc(listing.getTitle(), 80) : "tin đăng";
        try {
            if (buyer.getEmail() != null && !buyer.getEmail().isBlank()) {
                String subject = "Nhắc: Còn khoảng 3 giờ tới giờ giao dịch";
                String body = htmlWrap(
                        "<p>Xin chào " + esc(displayName(buyer)) + ",</p>"
                                + "<p>Giao dịch cho «" + esc(title) + "» dự kiến lúc <strong>" + esc(pickupStr)
                                + "</strong> (còn khoảng 3 giờ). Vui lòng liên hệ đối phương nếu cần đổi lịch.</p>"
                                + "<p><a href=\"" + esc(listingUrl(listing.getId())) + "\">Xem tin</a></p>");
                send(buyer.getEmail(), subject, body);
            }
            if (seller.getEmail() != null && !seller.getEmail().isBlank()) {
                String subject = "Nhắc: Còn khoảng 3 giờ tới giờ giao dịch";
                String body = htmlWrap(
                        "<p>Xin chào " + esc(displayName(seller)) + ",</p>"
                                + "<p>Giao dịch với người mua cho «" + esc(title) + "» dự kiến lúc <strong>"
                                + esc(pickupStr) + "</strong> (còn khoảng 3 giờ).</p>"
                                + "<p><a href=\"" + esc(listingUrl(listing.getId())) + "\">Xem tin</a></p>");
                send(seller.getEmail(), subject, body);
            }
        } catch (Exception ex) {
            log.warn("sendPickupReminderEmails dealId={}: {}", deal.getId(), ex.getMessage());
        }
    }

    private void send(String to, String subject, String htmlBody) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.debug("JavaMailSender not configured, skip email to {}", to);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.debug("Email sent to {} subject={}", to, subject);
        } catch (Exception ex) {
            log.warn("send email failed to {}: {}", to, ex.getMessage());
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
