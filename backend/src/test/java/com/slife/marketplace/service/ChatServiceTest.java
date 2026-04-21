package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionPageResponse;
import com.slife.marketplace.entity.*;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.*;
import com.slife.marketplace.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private BlockService blockService;
    @Mock private UserService userService;
    @Mock private NotificationService notificationService;
    @Mock private SystemEmailService systemEmailService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private UserFileStorageService userFileStorage;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;
    @Mock private RedisWebSocketRelayService wsRelay;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(
                conversationRepository, messageRepository, listingRepository,
                offerRepository, blockService, userService, notificationService,
                systemEmailService, messagingTemplate, userFileStorage, userFileStorage,
                redisTemplate, wsRelay
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static User user(long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("User" + id);
        u.setStatus("ACTIVE");
        return u;
    }

    private static Listing listing(long id, User seller, String title) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setStatus("ACTIVE");
        l.setTitle(title);
        return l;
    }

    private static Conversation conv(long id, String sessionUuid, Listing listing, User u1, User u2) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setSessionUuid(sessionUuid);
        c.setListing(listing);
        c.setUserId1(u1);
        c.setUserId2(u2);
        c.setStatus(Conversation.STATUS_ACTIVE);
        c.setCreatedAt(Instant.now());
        return c;
    }

    private static Message msg(long id, Conversation c, User sender,
                               MessageType type, String content, boolean read) {
        Message m = new Message();
        m.setId(id);
        m.setConversation(c);
        m.setSender(sender);
        m.setMessageType(type);
        m.setContent(content);
        m.setSentAt(Instant.now());
        m.setIsRead(read);
        return m;
    }

    private static Offer pendingOffer(long id, User buyer, Listing l, Conversation c, BigDecimal amount) {
        Offer o = new Offer();
        o.setId(id);
        o.setStatus(OfferService.STATUS_PENDING);
        o.setBuyer(buyer);
        o.setListing(l);
        o.setConversation(c);
        o.setAmount(amount);
        return o;
    }

    // =========================================================================
    // Function: getOrCreateSession(Long listingId, User buyer)
    // Dependencies: userService · listingRepository · blockService · conversationRepository
    // =========================================================================
    @Nested
    @DisplayName("Tạo/lấy phiên chat | Function: getOrCreateSession(Long, User)")
    class GetOrCreateSessionUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Chưa có phiên chat nào → tạo hội thoại mới và lưu DB")
        void utcid01_noExistingSession_createsNew() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Xe đạp cũ");

            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L))
                    .thenReturn(Optional.empty());
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> {
                Conversation c = inv.getArgument(0);
                c.setId(99L);
                c.ensureSessionUuid();
                return c;
            });

            Conversation out = chatService.getOrCreateSession(10L, buyer);

            assertEquals(99L, out.getId());
            assertNotNull(out.getSessionUuid());
            assertEquals(Conversation.STATUS_ACTIVE, out.getStatus());
            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [A] Người mua chính là người bán → INVALID_INPUT, không tạo phiên chat")
        void utcid02_buyerIsSeller_invalidInput() {
            User buyer = user(1L, "seller@fpt.edu.vn");
            Listing l = listing(10L, buyer, "Xe đạp cũ"); // seller == buyer

            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            verify(conversationRepository, never()).save(any());
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID-03 [A] Một trong hai bên đã Block nhau → FORBIDDEN, từ chối tạo phiên chat")
        void utcid03_blocked_forbidden() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Điện thoại cũ");

            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
            verify(conversationRepository, never()).save(any());
        }
    }

    // =========================================================================
    // Function: sendMessage(..., User sender)
    // Dependencies: redisTemplate · conversationRepository · blockService · messageRepository
    // =========================================================================
    @Nested
    @DisplayName("Gửi tin nhắn | Function: sendMessage(..., User sender)")
    class SendMessageUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [A] Tài khoản BANNED hoặc RESTRICTED → chặn ngay, không mở session")
        void utcid01_bannedOrRestricted_blocked() {
            User banned = user(1L, "a@fpt.edu.vn");
            banned.setStatus("BANNED");
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("s", null, "hi", MessageType.TEXT, null, null, null, banned));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex1.getErrorCode());

            User restricted = user(2L, "b@fpt.edu.vn");
            restricted.setStatus("RESTRICTED");
            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("s", null, "hi", MessageType.TEXT, null, null, null, restricted));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex2.getErrorCode());

            verifyNoInteractions(conversationRepository);
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [A] Một trong hai bên đã Block nhau → FORBIDDEN, không lưu tin nhắn")
        void utcid02_blockedParticipant_forbidden() {
            User sender = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess", listing(10L, other, "Bàn phím"), sender, other);

            when(conversationRepository.findBySessionUuid("sess")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("sess", null, "hi", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
            verifyNoInteractions(messageRepository);
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID-03 [B] Gửi 2 tin trong cùng 1 giây → Redis Rate Limit kích hoạt, chặn tin thứ 2")
        void utcid03_rateLimitExceeded_secondMessageBlocked() {
            User sender = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess", listing(10L, other, "Laptop"), sender, other);

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(redisTemplate.hasKey("chat:rate:1")).thenReturn(false, true);
            when(conversationRepository.findBySessionUuid("sess")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(10L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() ->
                    chatService.sendMessage("sess", null, "tin 1", MessageType.TEXT, null, null, null, sender));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("sess", null, "tin 2", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.RATE_LIMIT_EXCEEDED, ex.getErrorCode());
        }

        @Test
        @Tag("UTCID-04")
        @DisplayName("UTCID-04 [N] Gửi tin TEXT hợp lệ → lưu DB, thông báo đối phương, broadcast phiên chat")
        void utcid04_validTextMessage_savedNotifyAndBroadcast() {
            User sender = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess-n", listing(10L, other, "Bàn học"), sender, other);

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(redisTemplate.hasKey("chat:rate:1")).thenReturn(false);
            when(conversationRepository.findBySessionUuid("sess-n")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(55L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));

            ChatMessageResponse out = chatService.sendMessage(
                    "sess-n", null, "hello world", MessageType.TEXT, null, null, null, sender);

            assertNotNull(out);
            assertEquals(55L, out.getId());
            assertEquals("hello world", out.getContent());
            verify(messageRepository).save(any(Message.class));
            verify(conversationRepository).save(any(Conversation.class));
            verify(notificationService).notifyNewMessage(eq(other), any(ChatMessageResponse.class), eq("sess-n"));
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.sess-n"), any(Object.class));
        }
    }

    // =========================================================================
    // Function: listSessionsFiltered(User, String, String q, Long, Instant, Instant, int, int)
    // Dependencies: conversationRepository · messageRepository · blockService
    // =========================================================================
    @Nested
    @DisplayName("Tìm kiếm hội thoại | Function: listSessionsFiltered(...)")
    class ListSessionsFilteredUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [B] Từ khóa tiếng Việt có dấu → bỏ dấu tự động, trả đúng kết quả khớp")
        void utcid01_vietnameseAccentSearch_matchesAfterFolding() {
            User me = user(1L, "me@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(5L, seller, "Điện thoại Samsung");
            Conversation c = conv(1L, "s1", l, me, seller);
            c.setLastMessageAt(Instant.now());

            when(conversationRepository.findAllByParticipantOrderByLastMessageDesc(1L))
                    .thenReturn(List.of(c));
            when(conversationRepository.findByListingSellerIdOrderByLastMessageDesc(1L))
                    .thenReturn(List.of());
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            ChatSessionPageResponse res = chatService.listSessionsFiltered(
                    me, "ALL", "Điện thoại", null, null, null, 0, 10);

            assertEquals(1, res.getTotalElements());
            assertEquals("Điện thoại Samsung", res.getContent().get(0).getListingTitle());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [N] Không có từ khóa lọc → trả về toàn bộ hội thoại của người dùng")
        void utcid02_noFilter_returnsAllSessions() {
            User me = user(1L, "me@fpt.edu.vn");
            User other = user(2L, "other@fpt.edu.vn");
            Listing l1 = listing(1L, other, "Sách giáo khoa");
            Listing l2 = listing(2L, other, "Xe đạp");
            Conversation c1 = conv(1L, "s1", l1, me, other);
            Conversation c2 = conv(2L, "s2", l2, me, other);

            when(conversationRepository.findAllByParticipantOrderByLastMessageDesc(1L))
                    .thenReturn(List.of(c1, c2));
            when(conversationRepository.findByListingSellerIdOrderByLastMessageDesc(1L))
                    .thenReturn(List.of());
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(2L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            ChatSessionPageResponse res = chatService.listSessionsFiltered(
                    me, "ALL", null, null, null, null, 0, 10);

            assertEquals(2, res.getTotalElements());
        }
    }

    // =========================================================================
    // Function: getHistory(String sessionId, int page, int size)
    // Dependencies: conversationRepository · userService · blockService · messageRepository
    // =========================================================================
    @Nested
    @DisplayName("Lịch sử tin nhắn | Function: getHistory(String, int, int)")
    class GetHistoryUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Session chứa TEXT + IMAGE → deliveryStatus đúng theo cờ isRead")
        void utcid01_mixedMessages_correctDeliveryStatus() {
            User me = user(1L, "me@fpt.edu.vn");
            User other = user(2L, "other@fpt.edu.vn");
            Listing l = listing(10L, other, "Sách cũ");
            Conversation c = conv(1L, "sess-h", l, me, other);

            Message unread = msg(1L, c, other, MessageType.TEXT,  "Còn hàng không?", false);
            Message read   = msg(2L, c, me,    MessageType.TEXT,  "Còn bạn nhé!",   true);
            Message image  = msg(3L, c, other, MessageType.IMAGE, "[Hình ảnh]",     false);

            when(conversationRepository.findBySessionUuid("sess-h")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(me);
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(unread, read, image), PageRequest.of(0, 10), 3));

            Page<ChatMessageResponse> out = chatService.getHistory("sess-h", 0, 10);

            assertEquals(3, out.getTotalElements());
            assertEquals("DELIVERED", out.getContent().get(0).getDeliveryStatus());
            assertEquals("SEEN",      out.getContent().get(1).getDeliveryStatus());
            assertEquals(MessageType.IMAGE, out.getContent().get(2).getMessageType());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [A] UUID phiên chat không tồn tại → CHAT_SESSION_NOT_FOUND")
        void utcid02_sessionNotFound_throws() {
            when(conversationRepository.findBySessionUuid("missing")).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.getHistory("missing", 0, 10));
            assertEquals(ErrorCode.CHAT_SESSION_NOT_FOUND, ex.getErrorCode());
            verifyNoInteractions(userService, messageRepository);
        }
    }

    // =========================================================================
    // Function: makeOffer(String sessionId, BigDecimal amount, User buyer)
    // Dependencies: conversationRepository · blockService · offerRepository
    //               · messageRepository · notificationService · systemEmailService · messagingTemplate
    // =========================================================================
    @Nested
    @DisplayName("Trả giá | Function: makeOffer(String, BigDecimal, User)")
    class MakeOfferUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [A] Đã có lượt trả giá PENDING chờ phản hồi → chặn spam, không tạo thêm Offer")
        void utcid01_pendingExists_antiSpam() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Xe máy cũ");
            Conversation c = conv(1L, "sess-o", l, buyer, seller);

            when(conversationRepository.findBySessionUuid("sess-o")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING))
                    .thenReturn(1L);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.makeOffer("sess-o", new BigDecimal("2000000"), buyer));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
            verify(offerRepository, never()).save(any());
            verifyNoInteractions(messageRepository);
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [N] Chưa có Offer PENDING → tạo Offer + tin OFFER_PROPOSAL + thông báo người bán")
        void utcid02_noExistingOffer_createsOfferAndMessage() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Xe máy cũ");
            Conversation c = conv(1L, "sess-o", l, buyer, seller);

            when(conversationRepository.findBySessionUuid("sess-o")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING))
                    .thenReturn(0L);
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
                Offer o = inv.getArgument(0);
                o.setId(77L);
                return o;
            });
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(88L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));

            ChatMessageResponse out = chatService.makeOffer("sess-o", new BigDecimal("900000"), buyer);

            assertNotNull(out);
            assertEquals(MessageType.OFFER_PROPOSAL, out.getMessageType());
            verify(offerRepository).save(any(Offer.class));
            verify(notificationService).notifyOfferProposal(
                    eq(seller), eq(buyer), eq(10L), eq("Xe máy cũ"), eq(new BigDecimal("900000")));
        }
    }

    // =========================================================================
    // Function: respondToOffer(Long offerId, String action, User seller)
    // Dependencies: offerRepository · blockService · conversationRepository
    //               · messageRepository · notificationService · systemEmailService · messagingTemplate
    // =========================================================================
    @Nested
    @DisplayName("Phản hồi trả giá | Function: respondToOffer(Long, String, User)")
    class RespondToOfferUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Người bán chấp nhận Offer → chốt đơn, DEAL_CONFIRMATION + Email/Thông báo 2 bên")
        void utcid01_sellerAccepts_dealConfirmedAndNotified() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Xe đạp xịn");
            Conversation c = conv(1L, "sess-d", l, buyer, seller);
            Offer offer = pendingOffer(7L, buyer, l, c, new BigDecimal("1500000"));

            when(offerRepository.findById(7L)).thenReturn(Optional.of(offer));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> inv.getArgument(0));
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(99L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));

            ChatMessageResponse res = chatService.respondToOffer(7L, "ACCEPTED", seller);

            assertNotNull(res);
            assertEquals(OfferService.STATUS_ACCEPTED, offer.getStatus());
            verify(notificationService).notifyDealConfirmed(
                    eq(buyer), eq(seller), eq(10L), eq("Xe đạp xịn"), eq(1L));
            verify(systemEmailService).sendOfferAcceptedEmails(
                    eq(buyer), eq(seller), eq("Xe đạp xịn"), eq(10L), eq(1L), any());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [N] Người bán từ chối Offer → REJECTED + tin nhắn từ chối + thông báo người mua")
        void utcid02_sellerRejects_buyerNotified() {
            User buyer = user(1L, "buyer@fpt.edu.vn");
            User seller = user(2L, "seller@fpt.edu.vn");
            Listing l = listing(10L, seller, "Xe đạp xịn");
            Conversation c = conv(1L, "sess-d", l, buyer, seller);
            Offer offer = pendingOffer(8L, buyer, l, c, new BigDecimal("500000"));

            when(offerRepository.findById(8L)).thenReturn(Optional.of(offer));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> inv.getArgument(0));
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(100L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));

            chatService.respondToOffer(8L, "REJECTED", seller);

            assertEquals(OfferService.STATUS_REJECTED, offer.getStatus());
            verify(notificationService).notifyOfferRejected(
                    eq(buyer), eq(seller), eq(10L), eq("Xe đạp xịn"), eq(new BigDecimal("500000")));
            verify(systemEmailService).sendOfferRejectedEmails(
                    eq(buyer), eq(seller), eq("Xe đạp xịn"), eq(10L), eq(new BigDecimal("500000")));
        }
    }

    // =========================================================================
    // Function: uploadChatImage(String sessionId, Long listingId, MultipartFile)
    // Dependencies: conversationRepository · userService · userFileStorage
    // =========================================================================
    @Nested
    @DisplayName("Upload ảnh chat | Function: uploadChatImage(String, Long, MultipartFile)")
    class UploadChatImageUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [A] File ảnh quá lớn (>5 MB) → FILE_TOO_LARGE, không gọi lưu file")
        void utcid01_fileTooLarge_rejected() {
            User current = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess-img", listing(10L, other, "Laptop"), current, other);

            when(conversationRepository.findBySessionUuid("sess-img")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);

            MockMultipartFile bigFile = new MockMultipartFile(
                    "file", "big.png", "image/png",
                    new byte[(int) (Constants.MAX_CHAT_IMAGE_BYTES + 1)]);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.uploadChatImage("sess-img", null, bigFile));

            assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
            verifyNoInteractions(userFileStorage);
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [A] Định dạng file không được hỗ trợ (gif) → INVALID_FILE_TYPE, không gọi lưu file")
        void utcid02_wrongContentType_rejected() {
            User current = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess-img", listing(10L, other, "Laptop"), current, other);

            when(conversationRepository.findBySessionUuid("sess-img")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);

            MockMultipartFile gifFile = new MockMultipartFile(
                    "file", "anim.gif", "image/gif", new byte[100]);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.uploadChatImage("sess-img", null, gifFile));

            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
            verifyNoInteractions(userFileStorage);
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID-03 [N] File PNG hợp lệ (≤5 MB) → lưu thành công, URL trả về đúng phần mở rộng .png")
        void utcid03_validPngFile_storedWithCorrectExtension() {
            User current = user(1L, "a@fpt.edu.vn");
            User other = user(2L, "b@fpt.edu.vn");
            Conversation c = conv(1L, "sess-img", listing(10L, other, "Laptop"), current, other);

            when(conversationRepository.findBySessionUuid("sess-img")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);
            MockMultipartFile png = new MockMultipartFile(
                    "file", "photo.png", "image/png", new byte[1024]);
            when(userFileStorage.storeMultipart(eq(png), anyString()))
                    .thenAnswer(inv -> "/uploads/" + inv.getArgument(1, String.class));

            String url = chatService.uploadChatImage("sess-img", null, png);

            assertTrue(url.endsWith(".png"));
            assertTrue(url.contains(Constants.CHAT_UPLOAD_DIR + "/sess-img/"));
            verify(userFileStorage).storeMultipart(eq(png), argThat(rel ->
                    rel.startsWith(Constants.CHAT_UPLOAD_DIR + "/sess-img/") && rel.endsWith(".png")));
        }
    }
}
