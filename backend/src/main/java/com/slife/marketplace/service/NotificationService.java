package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.NotificationResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Message;
import com.slife.marketplace.entity.Notification;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public static final String TYPE_MESSAGE  = "MESSAGE";
    public static final String TYPE_DEAL     = "DEAL";
    // DB enum currently does not include OFFER, reuse SYSTEM for compatibility.
    public static final String TYPE_OFFER    = "SYSTEM";
    public static final String TYPE_REPORT   = "REPORT";
    // Comment notifications reuse MESSAGE type to match DB ENUM
    public static final String TYPE_COMMENT  = TYPE_MESSAGE;
    public static final String TYPE_SYSTEM   = "SYSTEM";
    public static final String TYPE_FOLLOW   = "FOLLOW";

    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Notify the recipient of a new chat message and push via WebSocket. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyNewMessage(User recipient, ChatMessageResponse msg, String sessionId) {
        try {
            // Persist a stable reference for deep-linking:
            // store MESSAGE id (refId) so FE can open + scroll to exact message (no parsing display strings).
            Long messageId = msg != null ? msg.getId() : null;
            Notification n = buildNotification(recipient, TYPE_MESSAGE,
                    "MESSAGE", messageId,
                    msg.getSenderName() + ": " + truncate(msg.getContent(), 60));
            notificationRepository.save(n);
            pushToUser(recipient.getEmail(), "/queue/messages", msg);
            pushNotificationCount(recipient);
            log.debug("notifyNewMessage recipientId={} session={}", recipient.getId(), sessionId);
        } catch (Exception ex) {
            log.error("notifyNewMessage failed recipientId={}", recipient.getId(), ex);
        }
    }

    /** Notify seller of a new offer proposal. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyOfferProposal(User seller, User buyer, Long listingId, java.math.BigDecimal amount) {
        try {
            Notification n = buildNotification(seller, TYPE_OFFER,
                    "LISTING", listingId,
                    buyer.getFullName() + " đề xuất giá " + amount.toPlainString() + "đ");
            notificationRepository.save(n);
            pushNotificationCount(seller);
        } catch (Exception ex) {
            log.error("notifyOfferProposal failed sellerId={}", seller.getId(), ex);
        }
    }

    /** Notify both parties when a deal is confirmed. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyDealConfirmed(User buyer, User seller, Long listingId, String listingTitle) {
        try {
            String text = "Deal đã được xác nhận cho: " + listingTitle;
            for (User u : List.of(buyer, seller)) {
                Notification n = buildNotification(u, TYPE_DEAL, "LISTING", listingId, text);
                notificationRepository.save(n);
                pushNotificationCount(u);
            }
        } catch (Exception ex) {
            log.error("notifyDealConfirmed failed listingId={}", listingId, ex);
        }
    }

    /** Notify listing owner when their listing is reported. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingReported(User listingOwner, User reporter, Long listingId, String listingTitle) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_REPORT,
                    "LISTING", listingId,
                    "Tin đăng \"" + truncate(listingTitle, 40) + "\" của bạn đã bị báo cáo bởi " + reporter.getFullName());
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyListingReported failed listingId={}", listingId, ex);
        }
    }

    /** Notify listing owner when admin hides their listing due to violation/report. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyAdminHiddenListing(User listingOwner, Long listingId, String listingTitle) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_SYSTEM,
                    "LISTING", listingId,
                    "Quản trị viên đã ẩn tin đăng \"" + truncate(listingTitle, 40) + "\" do vi phạm quy định.");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyAdminHiddenListing failed listingId={}", listingId, ex);
        }
    }

    /** Notify user when admin bans account due to violation/report. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyAdminBannedUser(User user) {
        try {
            Notification n = buildNotification(user, TYPE_SYSTEM,
                    "USER", user.getId(),
                    "Tài khoản của bạn đã bị khóa do vi phạm quy định cộng đồng.");
            notificationRepository.save(n);
            pushNotificationCount(user);
        } catch (Exception ex) {
            log.error("notifyAdminBannedUser failed userId={}", user.getId(), ex);
        }
    }

    /** Notify user when someone starts following them. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyNewFollower(User followed, User follower) {
        try {
            String name = follower.getFullName() != null && !follower.getFullName().isBlank()
                    ? follower.getFullName()
                    : follower.getEmail();
            Notification n = buildNotification(followed, TYPE_FOLLOW, "USER", follower.getId(),
                    name + " đã bắt đầu theo dõi bạn.");
            notificationRepository.save(n);
            pushNotificationCount(followed);
        } catch (Exception ex) {
            log.error("notifyNewFollower failed followedId={}", followed.getId(), ex);
        }
    }

    /** Notify listing owner when a new comment is posted on their listing. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingCommented(User listingOwner, User commenter, Long listingId, String listingTitle) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_COMMENT,
                    "LISTING", listingId,
                    commenter.getFullName() + " đã bình luận trên tin \"" + truncate(listingTitle, 40) + "\"");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyListingCommented failed listingId={}", listingId, ex);
        }
    }

    // ── REST helpers ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationResponses(Long userId) {
        List<Notification> list = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private Notification buildNotification(User user, String type, String refType, Long refId, String content) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setRefType(refType);
        n.setRefId(refId);
        n.setContent(content);
        n.setIsRead(false);
        n.setCreatedAt(Instant.now());
        return n;
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse dto = NotificationResponse.from(n);
        if (n.getRefType() == null || n.getRefId() == null) return dto;

        String rt = n.getRefType().trim().toUpperCase();
        try {
            if ("CONVERSATION".equals(rt)) {
                String sessionId = conversationRepository.findById(n.getRefId())
                        .map(Conversation::getSessionUuid)
                        .orElse(null);
                dto.setSessionId(sessionId);
                return dto;
            }

            // Optional: if later we store MESSAGE refId, we can resolve both messageId + sessionId
            if ("MESSAGE".equals(rt)) {
                dto.setMessageId(n.getRefId());
                Message m = messageRepository.findById(n.getRefId()).orElse(null);
                if (m != null && m.getConversation() != null) {
                    dto.setSessionId(m.getConversation().getSessionUuid());
                }
            }
        } catch (Exception ex) {
            log.warn("toResponse resolve deep-link failed notificationId={} refType={} refId={}",
                    n.getId(), n.getRefType(), n.getRefId());
        }
        return dto;
    }

    private void pushToUser(String email, String destination, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(email, destination, payload);
        } catch (Exception ex) {
            log.warn("WS push failed email={} dest={}: {}", email, destination, ex.getMessage());
        }
    }

    private void pushNotificationCount(User user) {
        try {
            long count = notificationRepository.countByUser_IdAndIsReadFalse(user.getId());
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", count);
        } catch (Exception ex) {
            log.warn("WS notification count push failed userId={}", user.getId());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
