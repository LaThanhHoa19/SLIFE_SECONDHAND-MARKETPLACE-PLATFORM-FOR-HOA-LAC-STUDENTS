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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

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
            String safeText = buildSafeNewChatNotificationText(msg);
            Notification n = buildNotification(recipient, TYPE_MESSAGE,
                    "MESSAGE", messageId,
                    safeText);
            notificationRepository.save(n);
            pushToUser(recipient.getEmail(), "/queue/messages", msg);
            pushNotificationCount(recipient);
            log.debug("notifyNewMessage recipientId={} session={}", recipient.getId(), sessionId);
        } catch (Exception ex) {
            log.error("notifyNewMessage failed recipientId={}", recipient.getId(), ex);
        }
    }

    /**
     * Không hiển thị nội dung tin nhắn (privacy / màn hình khóa). Chỉ tên người gửi + tin đăng nếu có.
     */
    private static String buildSafeNewChatNotificationText(ChatMessageResponse msg) {
        if (msg == null) {
            return "Bạn có tin nhắn mới";
        }
        String sender = msg.getSenderName();
        if (sender == null || sender.isBlank()) {
            sender = "Người dùng";
        }
        String listingTitle = msg.getListingTitle();
        if (listingTitle != null && !listingTitle.isBlank()) {
            return "Tin nhắn mới từ " + sender + " · " + truncate(listingTitle.trim(), 48);
        }
        return "Tin nhắn mới từ " + sender;
    }

    /**
     * Người mua đề xuất giá — refType OFFER + refId = conversation_id khi đã có hội thoại (mở thẳng chat),
     * ngược lại LISTING + listingId (mở trang tin).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyOfferProposal(User seller, User buyer, Long listingId, String listingTitle,
                                    java.math.BigDecimal amount) {
        try {
            String buyerName = displayName(buyer);
            String title = listingTitle != null && !listingTitle.isBlank() ? listingTitle.trim() : "tin đăng";
            String text = buyerName + " đề xuất giá " + amount.toPlainString() + "đ cho sản phẩm «"
                    + truncate(title, 52) + "» — mở chat để xem chi tiết.";
            Long convId = resolveConversationId(listingId, buyer, seller);
            String refType = convId != null ? "OFFER" : "LISTING";
            Long refId = convId != null ? convId : listingId;
            Notification n = buildNotification(seller, TYPE_OFFER, refType, refId, text);
            notificationRepository.save(n);
            pushNotificationCount(seller);
        } catch (Exception ex) {
            log.error("notifyOfferProposal failed sellerId={}", seller.getId(), ex);
        }
    }

    /**
     * Người bán chấp nhận trả giá — cả hai vào chat theo conversationId nếu có.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyDealConfirmed(User buyer, User seller, Long listingId, String listingTitle,
                                    Long conversationId) {
        try {
            String title = listingTitle != null && !listingTitle.isBlank() ? listingTitle.trim() : "tin đăng";
            String buyerText = "Người bán đã chấp nhận mức giá bạn đề xuất cho «"
                    + truncate(title, 52) + "» — tiếp tục trao đổi trong chat.";
            String sellerText = displayName(buyer) + " đã được bạn chấp nhận trả giá cho «"
                    + truncate(title, 52) + "» — mở chat để chốt giao dịch.";
            String refType = conversationId != null ? "CONVERSATION" : "LISTING";
            Long refId = conversationId != null ? conversationId : listingId;
            Notification nb = buildNotification(buyer, TYPE_DEAL, refType, refId, buyerText);
            notificationRepository.save(nb);
            pushNotificationCount(buyer);
            Notification ns = buildNotification(seller, TYPE_DEAL, refType, refId, sellerText);
            notificationRepository.save(ns);
            pushNotificationCount(seller);
        } catch (Exception ex) {
            log.error("notifyDealConfirmed failed listingId={}", listingId, ex);
        }
    }

    /**
     * Người bán từ chối lượt trả giá — thông báo cho người mua.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyOfferRejected(User buyer, User seller, Long listingId, String listingTitle,
                                    java.math.BigDecimal amount) {
        try {
            String title = listingTitle != null && !listingTitle.isBlank() ? listingTitle.trim() : "tin đăng";
            String text = "Người bán đã từ chối mức giá " + amount.toPlainString() + "đ bạn đề xuất cho «"
                    + truncate(title, 52) + "» — có thể trao đổi thêm trong chat.";
            Long convId = resolveConversationId(listingId, buyer, seller);
            String refType = convId != null ? "OFFER_REJECT" : "LISTING";
            Long refId = convId != null ? convId : listingId;
            Notification n = buildNotification(buyer, TYPE_SYSTEM, refType, refId, text);
            notificationRepository.save(n);
            pushNotificationCount(buyer);
        } catch (Exception ex) {
            log.error("notifyOfferRejected failed buyerId={}", buyer.getId(), ex);
        }
    }

    private Long resolveConversationId(Long listingId, User buyer, User seller) {
        if (listingId == null || buyer == null || seller == null) {
            return null;
        }
        Long bid = buyer.getId();
        Long sid = seller.getId();
        if (bid == null || sid == null) {
            return null;
        }
        try {
            return conversationRepository.findActiveByListingAndParticipants(listingId, bid, sid)
                    .map(Conversation::getId)
                    .orElse(null);
        } catch (Exception ex) {
            log.warn("resolveConversationId failed listingId={}: {}", listingId, ex.getMessage());
            return null;
        }
    }

    private static String displayName(User u) {
        if (u == null) {
            return "Người dùng";
        }
        if (u.getFullName() != null && !u.getFullName().isBlank()) {
            return u.getFullName().trim();
        }
        if (u.getEmail() != null && !u.getEmail().isBlank()) {
            return u.getEmail().trim();
        }
        return "Người dùng";
    }

    /** Notify listing owner when a deal is finalized (SUCCESS) or cancelled by buyer. */
    @Transactional
    public void notifyDealFinalized(User seller, User buyer, Long listingId, String listingTitle, boolean isSuccess, boolean rated) {
        try {
            String buyerName = displayName(buyer);
            String title = (listingTitle != null && !listingTitle.isBlank()) ? listingTitle.trim() : "tin đăng của bạn";
            String text;
            if (isSuccess) {
                if (rated) {
                    text = "Giao dịch thành công! " + buyerName + " đã xác nhận nhận hàng và để lại đánh giá cho bạn về sản phẩm «" + truncate(title, 40) + "».";
                } else {
                    text = "Giao dịch thành công! " + buyerName + " đã xác nhận nhận hàng cho sản phẩm «" + truncate(title, 40) + "». Hãy kiểm tra uy tín của bạn!";
                }
            } else {
                text = buyerName + " đã hủy chốt đơn cho sản phẩm «" + truncate(title, 40) + "». Tin đăng đã khả dụng trở lại.";
            }

            Long convId = resolveConversationId(listingId, buyer, seller);
            String refType = convId != null ? "DEAL" : "LISTING";
            Long refId = convId != null ? convId : listingId;
            
            Notification n = buildNotification(seller, TYPE_DEAL, refType, refId, text);
            notificationRepository.save(n);
            pushNotificationCount(seller);
        } catch (Exception ex) {
            log.error("notifyDealFinalized failed sellerId={} listingId={}", seller.getId(), listingId, ex);
        }
    }

    /** Thông báo cho người bán khi nhận được đánh giá mới. */
    @Transactional
    public void notifyNewReview(User seller, User buyer, Long listingId, String listingTitle, int rating, Long conversationId) {
        try {
            String text = displayName(buyer) + " đã gửi đánh giá " + rating + " sao cho bài đăng «" + truncate(listingTitle, 40) + "».";
            Long refId = (conversationId != null) ? conversationId : resolveConversationId(listingId, buyer, seller);
            String refType = (refId != null) ? "DEAL" : "LISTING";
            // refId uses conversation_id if DEAL, listing_id if LISTING
            Long targetRefId = (refId != null) ? refId : listingId;
            
            Notification n = buildNotification(seller, TYPE_DEAL, refType, targetRefId, text);
            notificationRepository.save(n);
            pushNotificationCount(seller);
        } catch (Exception ex) {
            log.error("notifyNewReview failed sellerId={} listingId={}", seller.getId(), listingId, ex);
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
    public void notifyAdminHiddenListing(User listingOwner, Long listingId, String listingTitle, Long reportId, String reasonCode) {
        try {
            String suffix = (reasonCode != null && !reasonCode.isBlank())
                    ? " (lý do: " + reasonCode.trim() + ")"
                    : "";
            Notification n = buildNotification(listingOwner, TYPE_SYSTEM,
                    "LISTING", listingId,
                    "[Moderation] Báo cáo #" + (reportId != null ? reportId : "?")
                            + ": Quản trị viên đã ẩn tin đăng \"" + truncate(listingTitle, 40)
                            + "\" do vi phạm quy định" + suffix + ".");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyAdminHiddenListing failed listingId={}", listingId, ex);
        }
    }

    /** Notify user when admin bans account due to violation/report. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyAdminBannedUser(User user, Long reportId, String reasonCode) {
        try {
            String suffix = (reasonCode != null && !reasonCode.isBlank())
                    ? " (lý do: " + reasonCode.trim() + ")"
                    : "";
            Notification n = buildNotification(user, TYPE_SYSTEM,
                    "USER", user.getId(),
                    "[Moderation] Báo cáo #" + (reportId != null ? reportId : "?")
                            + ": Tài khoản của bạn đã bị khóa do vi phạm quy định cộng đồng"
                            + suffix
                            + ". Nếu cần khiếu nại, vui lòng liên hệ bộ phận hỗ trợ.");
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

    /** Notify followers when a seller posts a new listing. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyFollowersAboutNewListing(User seller, Long listingId, String listingTitle, Set<Long> followerIds) {
        if (seller == null || listingId == null || followerIds == null || followerIds.isEmpty()) {
            return;
        }

        String sellerName = (seller.getFullName() != null && !seller.getFullName().isBlank())
                ? seller.getFullName()
                : seller.getEmail();
        String content = sellerName + " vừa đăng tin mới: \"" + truncate(listingTitle, 40) + "\"";

        for (Long followerId : followerIds) {
            if (followerId == null || followerId.equals(seller.getId())) {
                continue;
            }
            try {
                User recipient = new User();
                recipient.setId(followerId);
                Notification n = buildNotification(recipient, TYPE_SYSTEM, "LISTING", listingId, content);
                notificationRepository.save(n);
                pushNotificationCount(recipient);
            } catch (Exception ex) {
                log.warn("notifyFollowersAboutNewListing failed followerId={} listingId={}", followerId, listingId, ex);
            }
        }
    }

    /** Notify listing owner when a new comment is posted on their listing. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingCommented(User listingOwner, User commenter, Long listingId) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_COMMENT,
                    "LISTING", listingId,
                    displayName(commenter) + " đã bình luận về bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyListingCommented failed listingId={}", listingId, ex);
        }
    }

    /** Notify listing owner when someone likes their listing (not self-like). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingLiked(User listingOwner, User liker, Long listingId) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_MESSAGE,
                    "LISTING", listingId,
                    displayName(liker) + " đã thích bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyListingLiked failed listingId={}", listingId, ex);
        }
    }

    /** Notify parent comment author when someone replies to their comment (listing). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingCommentReply(User parentCommentAuthor, User replier, Long listingId) {
        try {
            Notification n = buildNotification(parentCommentAuthor, TYPE_COMMENT,
                    "LISTING", listingId,
                    displayName(replier) + " đã trả lời bình luận của bạn");
            notificationRepository.save(n);
            pushNotificationCount(parentCommentAuthor);
        } catch (Exception ex) {
            log.error("notifyListingCommentReply failed listingId={}", listingId, ex);
        }
    }

    /**
     * Optional: notify listing owner when a third party joins a thread (reply on someone else's comment).
     * Skipped when owner is the parent author (they already get the reply notification).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyListingDiscussionJoined(User listingOwner, User replier, Long listingId) {
        try {
            Notification n = buildNotification(listingOwner, TYPE_COMMENT,
                    "LISTING", listingId,
                    displayName(replier) + " đã tham gia thảo luận trong bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(listingOwner);
        } catch (Exception ex) {
            log.error("notifyListingDiscussionJoined failed listingId={}", listingId, ex);
        }
    }

    // ── Community post (refType COMMUNITY_POST → FE /community/posts/{id}) ──

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyCommunityPostLiked(User postAuthor, User liker, Long postId) {
        try {
            Notification n = buildNotification(postAuthor, TYPE_MESSAGE,
                    "COMMUNITY_POST", postId,
                    displayName(liker) + " đã thích bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(postAuthor);
        } catch (Exception ex) {
            log.error("notifyCommunityPostLiked failed postId={}", postId, ex);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyCommunityPostCommented(User postAuthor, User commenter, Long postId) {
        try {
            Notification n = buildNotification(postAuthor, TYPE_COMMENT,
                    "COMMUNITY_POST", postId,
                    displayName(commenter) + " đã bình luận về bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(postAuthor);
        } catch (Exception ex) {
            log.error("notifyCommunityPostCommented failed postId={}", postId, ex);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyCommunityCommentReply(User parentCommentAuthor, User replier, Long postId) {
        try {
            Notification n = buildNotification(parentCommentAuthor, TYPE_COMMENT,
                    "COMMUNITY_POST", postId,
                    displayName(replier) + " đã trả lời bình luận của bạn");
            notificationRepository.save(n);
            pushNotificationCount(parentCommentAuthor);
        } catch (Exception ex) {
            log.error("notifyCommunityCommentReply failed postId={}", postId, ex);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyCommunityDiscussionJoined(User postAuthor, User replier, Long postId) {
        try {
            Notification n = buildNotification(postAuthor, TYPE_COMMENT,
                    "COMMUNITY_POST", postId,
                    displayName(replier) + " đã tham gia thảo luận trong bài viết của bạn");
            notificationRepository.save(n);
            pushNotificationCount(postAuthor);
        } catch (Exception ex) {
            log.error("notifyCommunityDiscussionJoined failed postId={}", postId, ex);
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
    public com.slife.marketplace.dto.response.CursorPageResponse<NotificationResponse> getNotificationResponsesPage(
            Long userId,
            int limit,
            String cursor
    ) {
        int size = Math.max(1, Math.min(limit, 50));
        NotificationCursorCodec.Cursor c = NotificationCursorCodec.decode(cursor);
        Instant cursorCreatedAt = c != null ? c.createdAt() : null;
        Long cursorId = c != null ? c.id() : null;
        Pageable pageable = PageRequest.of(0, size);
        List<Notification> list = notificationRepository.findPageByUser(userId, cursorCreatedAt, cursorId, pageable);
        List<NotificationResponse> items = list.stream().map(this::toResponse).toList();
        boolean hasMore = list.size() == size;
        String nextCursor = null;
        if (hasMore) {
            Notification last = list.get(list.size() - 1);
            nextCursor = NotificationCursorCodec.encode(last.getCreatedAt(), last.getId());
        }
        return new com.slife.marketplace.dto.response.CursorPageResponse<>(items, nextCursor, hasMore);
    }

    @Transactional(readOnly = true)
    public com.slife.marketplace.dto.response.CursorPageResponse<NotificationResponse> searchNotificationResponsesPage(
            Long userId,
            String q,
            int limit,
            String cursor
    ) {
        String query = q != null ? q.trim() : "";
        if (query.length() > 100) query = query.substring(0, 100);
        int size = Math.max(1, Math.min(limit, 50));
        NotificationCursorCodec.Cursor c = NotificationCursorCodec.decode(cursor);
        Instant cursorCreatedAt = c != null ? c.createdAt() : null;
        Long cursorId = c != null ? c.id() : null;
        Pageable pageable = PageRequest.of(0, size);
        List<Notification> list = notificationRepository.searchPageByUser(userId, query, cursorCreatedAt, cursorId, pageable);
        List<NotificationResponse> items = list.stream().map(this::toResponse).toList();
        boolean hasMore = list.size() == size;
        String nextCursor = null;
        if (hasMore) {
            Notification last = list.get(list.size() - 1);
            nextCursor = NotificationCursorCodec.encode(last.getCreatedAt(), last.getId());
        }
        return new com.slife.marketplace.dto.response.CursorPageResponse<>(items, nextCursor, hasMore);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        if (userId == null || notificationId == null) return;
        notificationRepository.markReadForUser(notificationId, userId);
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
            if ("CONVERSATION".equals(rt) || "DEAL".equals(rt)) {
                String sessionId = conversationRepository.findById(n.getRefId())
                        .map(Conversation::getSessionUuid)
                        .orElse(null);
                dto.setSessionId(sessionId);
                return dto;
            }

            if ("OFFER".equals(rt) || "OFFER_REJECT".equals(rt)) {
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
