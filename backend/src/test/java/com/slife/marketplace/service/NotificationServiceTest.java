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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(
                notificationRepository,
                conversationRepository,
                messageRepository,
                messagingTemplate
        );
    }

    private static User user(long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("U" + id);
        return u;
    }

    private static Conversation conversation(long id, String sessionUuid) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setSessionUuid(sessionUuid);
        return c;
    }

    private static Notification n(long id, User u, String type, String refType, Long refId, String content, boolean read, Instant createdAt) {
        Notification n = new Notification();
        n.setId(id);
        n.setUser(u);
        n.setType(type);
        n.setRefType(refType);
        n.setRefId(refId);
        n.setContent(content);
        n.setIsRead(read);
        n.setCreatedAt(createdAt != null ? createdAt : Instant.now());
        return n;
    }

    // =========================================================================
    // Nhóm: Thông báo tin nhắn mới (chat)
    // =========================================================================
    @Nested
    @DisplayName("Thông báo tin nhắn mới (notifyNewMessage)")
    class NotifyNewMessage {

        @Test
        @DisplayName("Luồng chính: lưu notification + đẩy (WS) message + đẩy (WS) số lượng chưa đọc")
        void notifyNewMessage_happyPath_shouldSaveAndPush() {
            User recipient = user(1L, "r@ex.com");
            ChatMessageResponse msg = new ChatMessageResponse();
            msg.setId(10L);
            msg.setSenderName("A");
            msg.setListingTitle("L");

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(3L);

            notificationService.notifyNewMessage(recipient, msg, "sess");

            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());
            Notification saved = captor.getValue();
            assertEquals(recipient.getId(), saved.getUser().getId());
            assertEquals(NotificationService.TYPE_MESSAGE, saved.getType());
            assertEquals("MESSAGE", saved.getRefType());
            assertEquals(10L, saved.getRefId());

            verify(messagingTemplate).convertAndSendToUser(eq("r@ex.com"), eq("/queue/messages"), eq(msg));
            verify(messagingTemplate).convertAndSendToUser(eq("r@ex.com"), eq("/queue/notifications"), eq(3L));
        }

        @Test
        @DisplayName("Nếu repo/WS lỗi thì không được làm hỏng luồng chính (không throw ra ngoài)")
        void notifyNewMessage_exception_shouldBeSwallowed() {
            User recipient = user(1L, "r@ex.com");
            doThrow(new RuntimeException("down")).when(notificationRepository).save(any(Notification.class));
            assertDoesNotThrow(() -> notificationService.notifyNewMessage(recipient, null, "sess"));
        }
    }

    // =========================================================================
    // Nhóm: Trả giá / chốt đơn (core marketplace)
    // =========================================================================
    @Nested
    @DisplayName("Thông báo trả giá / chốt đơn")
    class OfferDealNotifications {

        @Test
        @DisplayName("Đề xuất giá: nếu resolve được hội thoại thì refType=OFFER và refId=conversationId")
        void notifyOfferProposal_withConv_shouldUseOfferRef() {
            User seller = user(2L, "s@ex.com");
            User buyer = user(1L, "b@ex.com");
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L))
                    .thenReturn(Optional.of(conversation(99L, "sess")));
            when(notificationRepository.countByUser_IdAndIsReadFalse(2L)).thenReturn(1L);

            notificationService.notifyOfferProposal(seller, buyer, 10L, "Title", new BigDecimal("900"));

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("OFFER", cap.getValue().getRefType());
            assertEquals(99L, cap.getValue().getRefId());
        }

        @Test
        @DisplayName("Đề xuất giá: nếu không resolve được hội thoại thì refType=LISTING và refId=listingId")
        void notifyOfferProposal_noConv_shouldUseListingRef() {
            User seller = user(2L, "s@ex.com");
            User buyer = user(1L, "b@ex.com");
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L))
                    .thenReturn(Optional.empty());
            when(notificationRepository.countByUser_IdAndIsReadFalse(2L)).thenReturn(1L);

            notificationService.notifyOfferProposal(seller, buyer, 10L, "Title", new BigDecimal("900"));

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("LISTING", cap.getValue().getRefType());
            assertEquals(10L, cap.getValue().getRefId());
        }

        @Test
        @DisplayName("Chấp nhận trả giá: tạo 2 notifications (người mua + người bán) và đẩy số chưa đọc cho cả 2")
        void notifyDealConfirmed_shouldSaveTwoAndPushCount() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(5L);
            when(notificationRepository.countByUser_IdAndIsReadFalse(2L)).thenReturn(6L);

            notificationService.notifyDealConfirmed(buyer, seller, 10L, "Title", 99L);

            verify(notificationRepository, times(2)).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(eq("b@ex.com"), eq("/queue/notifications"), eq(5L));
            verify(messagingTemplate).convertAndSendToUser(eq("s@ex.com"), eq("/queue/notifications"), eq(6L));
        }

        @Test
        @DisplayName("Từ chối trả giá: nếu có hội thoại thì refType=OFFER_REJECT")
        void notifyOfferRejected_withConv_shouldUseOfferRejectRef() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L))
                    .thenReturn(Optional.of(conversation(77L, "sess")));
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(1L);

            notificationService.notifyOfferRejected(buyer, seller, 10L, "Title", new BigDecimal("900"));

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("OFFER_REJECT", cap.getValue().getRefType());
            assertEquals(77L, cap.getValue().getRefId());
        }

        @Test
        @DisplayName("Hoàn tất giao dịch: success (có/không rated) và cancel đều phải lưu + đẩy số chưa đọc")
        void notifyDealFinalized_variants_shouldSave() {
            User seller = user(2L, "s@ex.com");
            User buyer = user(1L, "b@ex.com");
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L))
                    .thenReturn(Optional.empty());
            when(notificationRepository.countByUser_IdAndIsReadFalse(2L)).thenReturn(1L);

            notificationService.notifyDealFinalized(seller, buyer, 10L, "Title", true, true);
            notificationService.notifyDealFinalized(seller, buyer, 10L, "Title", false, false);

            verify(notificationRepository, times(2)).save(any(Notification.class));
            verify(messagingTemplate, times(2)).convertAndSendToUser(eq("s@ex.com"), eq("/queue/notifications"), eq(1L));
        }
    }

    // =========================================================================
    // Nhóm: Các thông báo khác — nguyên tắc chung là lưu + đẩy số chưa đọc
    // =========================================================================
    @Nested
    @DisplayName("Các thông báo khác (lưu + đẩy số chưa đọc)")
    class MiscNotifyMethods {

        @Test
        @DisplayName("Có người theo dõi mới: lưu notification + đẩy số chưa đọc")
        void notifyNewFollower_shouldSaveAndPush() {
            User followed = user(1L, "f@ex.com");
            User follower = user(2L, "x@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(2L);
            notificationService.notifyNewFollower(followed, follower);
            verify(notificationRepository).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(eq("f@ex.com"), eq("/queue/notifications"), eq(2L));
        }

        @Test
        @DisplayName("Thông báo follower khi có tin mới: nếu input null/empty thì return (không save)")
        void notifyFollowersAboutNewListing_empty_shouldReturn() {
            notificationService.notifyFollowersAboutNewListing(null, 10L, "T", Set.of(1L));
            notificationService.notifyFollowersAboutNewListing(user(1L, "a@ex.com"), null, "T", Set.of(1L));
            notificationService.notifyFollowersAboutNewListing(user(1L, "a@ex.com"), 10L, "T", null);
            notificationService.notifyFollowersAboutNewListing(user(1L, "a@ex.com"), 10L, "T", Set.of());
            verifyNoInteractions(notificationRepository);
        }

        @Test
        @DisplayName("Thông báo follower khi có tin mới: bỏ qua followerId = null / chính seller")
        void notifyFollowersAboutNewListing_shouldSkipNullAndSelf() {
            User seller = user(5L, "s@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(anyLong())).thenReturn(1L);
            notificationService.notifyFollowersAboutNewListing(seller, 10L, "T", Set.of(5L, 6L));
            verify(notificationRepository, times(1)).save(any(Notification.class)); // only followerId=6
        }

        @Test
        @DisplayName("Có đánh giá mới: lưu notification + đẩy số chưa đọc")
        void notifyNewReview_shouldSaveAndPush() {
            User seller = user(2L, "s@ex.com");
            User buyer = user(1L, "b@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(2L)).thenReturn(1L);
            notificationService.notifyNewReview(seller, buyer, 10L, "Title", 5, 99L);
            verify(notificationRepository).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(eq("s@ex.com"), eq("/queue/notifications"), eq(1L));
        }

        @Test
        @DisplayName("Tin bị báo cáo: lưu notification + đẩy số chưa đọc")
        void notifyListingReported_shouldSaveAndPush() {
            User owner = user(1L, "o@ex.com");
            User reporter = user(2L, "r@ex.com");
            reporter.setFullName("Reporter");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(2L);
            notificationService.notifyListingReported(owner, reporter, 10L, "Title");
            verify(notificationRepository).save(any(Notification.class));
            verify(messagingTemplate).convertAndSendToUser(eq("o@ex.com"), eq("/queue/notifications"), eq(2L));
        }

        @Test
        @DisplayName("Hành động admin (ẩn tin / khóa user): lưu notification + đẩy số chưa đọc")
        void notifyAdminActions_shouldSaveAndPush() {
            User owner = user(1L, "o@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(3L);
            notificationService.notifyAdminHiddenListing(owner, 10L, "Title", 5L, "R1");
            notificationService.notifyAdminBannedUser(owner, 5L, "R2");
            verify(notificationRepository, times(2)).save(any(Notification.class));
            verify(messagingTemplate, times(2)).convertAndSendToUser(eq("o@ex.com"), eq("/queue/notifications"), eq(3L));
        }

        @Test
        @DisplayName("Cảnh báo report user được duyệt nhưng chưa bị ban: lưu notification + đẩy số chưa đọc")
        void notifyReportApprovedUserWarning_shouldSaveAndPush() {
            User target = user(1L, "o@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(4L);

            notificationService.notifyReportApprovedUserWarning(target, 5L, "SPAM", 1, 3);

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(cap.capture());
            assertEquals("USER", cap.getValue().getRefType());
            assertEquals(1L, cap.getValue().getRefId());
            assertTrue(cap.getValue().getContent().contains("1/3"));
            verify(messagingTemplate).convertAndSendToUser(eq("o@ex.com"), eq("/queue/notifications"), eq(4L));
        }

        @Test
        @DisplayName("Tương tác tin đăng (bình luận/thích/trả lời/tham gia thảo luận): lưu notification + đẩy số chưa đọc")
        void listingInteractionNotifies_shouldSaveAndPush() {
            User owner = user(1L, "o@ex.com");
            User actor = user(2L, "a@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(1L);

            notificationService.notifyListingCommented(owner, actor, 10L);
            notificationService.notifyListingLiked(owner, actor, 10L);
            notificationService.notifyListingCommentReply(owner, actor, 10L);
            notificationService.notifyListingDiscussionJoined(owner, actor, 10L);

            verify(notificationRepository, times(4)).save(any(Notification.class));
            verify(messagingTemplate, times(4)).convertAndSendToUser(eq("o@ex.com"), eq("/queue/notifications"), eq(1L));
        }

        @Test
        @DisplayName("Tương tác community (thích/bình luận/trả lời/tham gia thảo luận): lưu notification + đẩy số chưa đọc")
        void communityInteractionNotifies_shouldSaveAndPush() {
            User author = user(1L, "o@ex.com");
            User actor = user(2L, "a@ex.com");
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(1L);

            notificationService.notifyCommunityPostLiked(author, actor, 10L);
            notificationService.notifyCommunityPostCommented(author, actor, 10L);
            notificationService.notifyCommunityCommentReply(author, actor, 10L);
            notificationService.notifyCommunityDiscussionJoined(author, actor, 10L);

            verify(notificationRepository, times(4)).save(any(Notification.class));
            verify(messagingTemplate, times(4)).convertAndSendToUser(eq("o@ex.com"), eq("/queue/notifications"), eq(1L));
        }
    }

    // =========================================================================
    // Nhóm: Các hàm phục vụ REST (đọc/trang/đánh dấu đã đọc)
    // =========================================================================
    @Nested
    @DisplayName("Các hàm phục vụ REST (get/list/page/mark read)")
    class RestHelpers {

        @Test
        @DisplayName("getNotifications: gọi repository và trả về danh sách")
        void getNotifications_shouldDelegate() {
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
            assertNotNull(notificationService.getNotifications(1L));
        }

        @Test
        @DisplayName("getNotificationResponses: map entity -> DTO")
        void getNotificationResponses_shouldMap() {
            User u = user(1L, "a@ex.com");
            Notification n1 = n(1L, u, "SYSTEM", "LISTING", 10L, "c", false, Instant.now());
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n1));
            List<NotificationResponse> out = notificationService.getNotificationResponses(1L);
            assertEquals(1, out.size());
            assertEquals(1L, out.get(0).getId());
        }

        @Test
        @DisplayName("getUnreadCount: trả về số notification chưa đọc")
        void getUnreadCount_shouldDelegate() {
            when(notificationRepository.countByUser_IdAndIsReadFalse(1L)).thenReturn(7L);
            assertEquals(7L, notificationService.getUnreadCount(1L));
        }

        @Test
        @DisplayName("markRead: nếu thiếu tham số thì bỏ qua; nếu đủ thì gọi repository")
        void markRead_shouldGuardNulls() {
            notificationService.markRead(null, 1L);
            notificationService.markRead(1L, null);
            verifyNoInteractions(notificationRepository);

            notificationService.markRead(1L, 2L);
            verify(notificationRepository).markReadForUser(2L, 1L);
        }

        @Test
        @DisplayName("markAllRead: đánh dấu toàn bộ đã đọc")
        void markAllRead_shouldCallRepo() {
            notificationService.markAllRead(1L);
            verify(notificationRepository).markAllReadForUser(1L);
        }

        @Test
        @DisplayName("getNotificationResponsesPage: nếu đủ size thì hasMore=true và sinh nextCursor")
        void getNotificationResponsesPage_hasMore_shouldReturnCursor() {
            User u = user(1L, "a@ex.com");
            Notification n1 = n(1L, u, "SYSTEM", "LISTING", 10L, "c1", false, Instant.now());
            Notification n2 = n(2L, u, "SYSTEM", "LISTING", 10L, "c2", false, Instant.now().minusSeconds(1));
            when(notificationRepository.findPageByUser(eq(1L), any(), any(), any(Pageable.class)))
                    .thenReturn(List.of(n1, n2));

            var res = notificationService.getNotificationResponsesPage(1L, 2, null);
            assertNotNull(res);
            assertTrue(res.isHasMore());
            assertNotNull(res.getNextCursor());
            assertEquals(2, res.getItems().size());
        }

        @Test
        @DisplayName("searchNotificationResponsesPage: trim/truncate query và phân trang an toàn")
        void searchNotificationResponsesPage_shouldTrimAndClamp() {
            when(notificationRepository.searchPageByUser(eq(1L), anyString(), any(), any(), any(Pageable.class)))
                    .thenReturn(List.of());
            var res = notificationService.searchNotificationResponsesPage(1L, "  abc  ", 999, null);
            assertNotNull(res);
            verify(notificationRepository).searchPageByUser(eq(1L), eq("abc"), any(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("toResponse (deep-link): refType=CONVERSATION thì resolve sessionId")
        void getNotificationResponses_shouldResolveConversationSession() {
            User u = user(1L, "a@ex.com");
            Notification n1 = n(1L, u, "DEAL", "CONVERSATION", 99L, "c", false, Instant.now());
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n1));
            when(conversationRepository.findById(99L)).thenReturn(Optional.of(conversation(99L, "sess")));

            List<NotificationResponse> out = notificationService.getNotificationResponses(1L);
            assertEquals("sess", out.get(0).getSessionId());
        }

        @Test
        @DisplayName("toResponse (deep-link): refType=MESSAGE thì set messageId và resolve sessionId theo message")
        void getNotificationResponses_shouldResolveMessageSession() {
            User u = user(1L, "a@ex.com");
            Notification n1 = n(1L, u, "MESSAGE", "MESSAGE", 10L, "c", false, Instant.now());
            when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n1));
            Message m = new Message();
            Conversation c = conversation(99L, "sess");
            m.setConversation(c);
            when(messageRepository.findById(10L)).thenReturn(Optional.of(m));

            List<NotificationResponse> out = notificationService.getNotificationResponses(1L);
            assertEquals(10L, out.get(0).getMessageId());
            assertEquals("sess", out.get(0).getSessionId());
        }
    }
}

