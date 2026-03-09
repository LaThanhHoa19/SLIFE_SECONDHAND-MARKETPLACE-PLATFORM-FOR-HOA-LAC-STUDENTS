package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.entity.Notification;
import com.slife.marketplace.entity.User;
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
    public static final String TYPE_OFFER    = "OFFER";
    public static final String TYPE_SYSTEM   = "SYSTEM";

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Notify the recipient of a new chat message and push via WebSocket. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyNewMessage(User recipient, ChatMessageResponse msg, String sessionId) {
        try {
            Notification n = buildNotification(recipient, TYPE_MESSAGE,
                    "CONVERSATION", null,
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

    // ── REST helpers ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
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
