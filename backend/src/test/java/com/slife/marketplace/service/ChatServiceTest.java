package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ChatMessageResponse;
import com.slife.marketplace.dto.response.ChatSessionPageResponse;
import com.slife.marketplace.dto.response.ChatSessionResponse;
import com.slife.marketplace.entity.*;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.MessageRepository;
import com.slife.marketplace.repository.OfferRepository;
import com.slife.marketplace.storage.FileStorage;
import com.slife.marketplace.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.file.Path;
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
    @Mock private FileStorage fileStorage;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(
                conversationRepository,
                messageRepository,
                listingRepository,
                offerRepository,
                blockService,
                userService,
                notificationService,
                systemEmailService,
                messagingTemplate,
                fileStorage,
                Path.of("uploads")
        );
    }

    private static User user(long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("U" + id);
        u.setStatus("ACTIVE");
        return u;
    }

    private static Listing listing(long id, User seller) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setStatus("ACTIVE");
        l.setTitle("Listing " + id);
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

    private static Message msg(long id, Conversation c, User sender, MessageType type, String content) {
        Message m = new Message();
        m.setId(id);
        m.setConversation(c);
        m.setSender(sender);
        m.setMessageType(type);
        m.setContent(content);
        m.setSentAt(Instant.now());
        m.setIsRead(false);
        return m;
    }

    // =========================================================================
    // getOrCreateSession
    // =========================================================================
    @Nested
    @DisplayName("Tạo/lấy phiên chat (getOrCreateSession)")
    class GetOrCreateSession {

        @Test
        @DisplayName("Người dùng hiện tại khác buyer -> FORBIDDEN")
        void getOrCreateSession_currentNotBuyer_shouldThrow() {
            User buyer = user(1L, "b@ex.com");
            when(userService.getCurrentUser()).thenReturn(user(2L, "x@ex.com"));
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không tìm thấy tin đăng -> LISTING_NOT_FOUND")
        void getOrCreateSession_listingNotFound_shouldThrow() {
            User buyer = user(1L, "b@ex.com");
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Buyer chính là seller -> INVALID_INPUT")
        void getOrCreateSession_sellerSelf_shouldThrow() {
            User buyer = user(1L, "b@ex.com");
            Listing l = listing(10L, buyer);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Bị block -> FORBIDDEN")
        void getOrCreateSession_blocked_shouldThrowForbidden() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getOrCreateSession(10L, buyer));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Đã có session active -> trả về session đó")
        void getOrCreateSession_existing_shouldReturn() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            Conversation existing = conv(5L, "sess", l, buyer, seller);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.of(existing));

            Conversation out = chatService.getOrCreateSession(10L, buyer);
            assertEquals(5L, out.getId());
        }

        @Test
        @DisplayName("Chưa có session -> tạo mới và save")
        void getOrCreateSession_createNew_shouldSave() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Listing l = listing(10L, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.empty());
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
                Conversation c = invocation.getArgument(0);
                c.setId(99L);
                if (c.getSessionUuid() == null) c.ensureSessionUuid();
                return c;
            });

            Conversation out = chatService.getOrCreateSession(10L, buyer);
            assertEquals(99L, out.getId());
            assertNotNull(out.getSessionUuid());
            assertEquals(Conversation.STATUS_ACTIVE, out.getStatus());
        }
    }

    // =========================================================================
    // listSessions / listSessionsFiltered
    // =========================================================================
    @Nested
    @DisplayName("Danh sách phiên chat có lọc (listSessionsFiltered)")
    class ListSessionsFiltered {

        @Test
        @DisplayName("Không lọc -> trả page và giới hạn size tối thiểu 1")
        void listSessionsFiltered_basicPagination_shouldReturnPage() {
            User me = user(1L, "me@ex.com");
            User other = user(2L, "o@ex.com");
            Listing l = listing(10L, other);
            Conversation c1 = conv(1L, "s1", l, me, other);
            when(conversationRepository.findAllByParticipantOrderByLastMessageDesc(1L)).thenReturn(List.of(c1));
            when(conversationRepository.findByListingSellerIdOrderByLastMessageDesc(1L)).thenReturn(List.of());

            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(msg(1L, c1, other, MessageType.TEXT, "hi"))));

            ChatSessionPageResponse res = chatService.listSessionsFiltered(me, "ALL", null, null, null, null, 0, 0);
            assertNotNull(res);
            assertEquals(1, res.getTotalElements());
            assertEquals(1, res.getContent().size());
        }

        @Test
        @DisplayName("Lọc theo q (khớp listingId dạng chuỗi) -> có kết quả")
        void listSessionsFiltered_qMatchesListingId_shouldFilter() {
            User me = user(1L, "me@ex.com");
            User other = user(2L, "o@ex.com");
            Listing l = listing(123L, other);
            l.setTitle("Xe dap");
            Conversation c1 = conv(1L, "s1", l, me, other);
            when(conversationRepository.findAllByParticipantOrderByLastMessageDesc(1L)).thenReturn(List.of(c1));
            when(conversationRepository.findByListingSellerIdOrderByLastMessageDesc(1L)).thenReturn(List.of());
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            ChatSessionPageResponse res = chatService.listSessionsFiltered(me, "ALL", "123", null, null, null, 0, 10);
            assertEquals(1, res.getContent().size());
        }

        @Test
        @DisplayName("listSessions(user) dùng listSessionsFiltered và trả content")
        void listSessions_shouldReturnContent() {
            User me = user(1L, "me@ex.com");
            when(conversationRepository.findAllByParticipantOrderByLastMessageDesc(1L)).thenReturn(List.of());
            when(conversationRepository.findByListingSellerIdOrderByLastMessageDesc(1L)).thenReturn(List.of());
            List<ChatSessionResponse> out = chatService.listSessions(me, "ALL");
            assertNotNull(out);
            assertTrue(out.isEmpty());
        }
    }

    // =========================================================================
    // getHistory
    // =========================================================================
    @Nested
    @DisplayName("Lịch sử tin nhắn (getHistory)")
    class GetHistory {

        @Test
        @DisplayName("Không tìm thấy phiên chat -> CHAT_SESSION_NOT_FOUND")
        void getHistory_sessionNotFound_shouldThrow() {
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getHistory("s", 0, 10));
            assertEquals(ErrorCode.CHAT_SESSION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không thuộc phiên chat -> NOT_CHAT_PARTICIPANT")
        void getHistory_notParticipant_shouldThrow() {
            User u1 = user(1L, "a@ex.com");
            User u2 = user(2L, "b@ex.com");
            Listing l = listing(10L, u2);
            Conversation c = conv(1L, "s", l, u1, u2);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(user(99L, "x@ex.com"));
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getHistory("s", 0, 10));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Bị block với peer -> FORBIDDEN")
        void getHistory_blocked_shouldThrowForbidden() {
            User me = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, me, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(me);
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.getHistory("s", 0, 10));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính -> trả Page<ChatMessageResponse>")
        void getHistory_happyPath_shouldReturnPage() {
            User me = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, me, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(me);
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            Message m = msg(10L, c, other, MessageType.TEXT, "hello");
            when(messageRepository.findByConversation_IdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(m), PageRequest.of(0, 10), 1));

            Page<ChatMessageResponse> out = chatService.getHistory("s", 0, 10);
            assertEquals(1, out.getTotalElements());
            assertEquals("hello", out.getContent().get(0).getContent());
        }
    }

    // =========================================================================
    // searchMessagesInSession
    // =========================================================================
    @Nested
    @DisplayName("Tìm kiếm tin nhắn trong một phiên (searchMessagesInSession)")
    class SearchMessagesInSession {

        @Test
        @DisplayName("q rỗng -> INVALID_INPUT")
        void search_blank_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.searchMessagesInSession("s", " ", 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("q < 2 ký tự -> INVALID_INPUT")
        void search_tooShort_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.searchMessagesInSession("s", "a", 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính -> gọi repository và map response")
        void search_happyPath_shouldReturnPage() {
            User me = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, me, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(me);
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            Message m = msg(10L, c, other, MessageType.TEXT, "hello world");
            when(messageRepository.findByConversation_IdAndDeletedAtIsNullAndContentContainingIgnoreCaseOrderBySentAtDesc(
                    eq(1L), eq("hello"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(m), PageRequest.of(0, 10), 1));

            Page<ChatMessageResponse> out = chatService.searchMessagesInSession("s", "hello", 0, 10);
            assertEquals(1, out.getTotalElements());
            assertEquals("hello world", out.getContent().get(0).getContent());
        }
    }

    // =========================================================================
    // sendMessage
    // =========================================================================
    @Nested
    @DisplayName("Gửi tin nhắn (sendMessage)")
    class SendMessage {

        @Test
        @DisplayName("User bị BANNED/RESTRICTED -> USER_BANNED_OR_RESTRICTED")
        void sendMessage_banned_shouldThrow() {
            User sender = user(1L, "a@ex.com");
            sender.setStatus("BANNED");
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("s", null, "hi", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.USER_BANNED_OR_RESTRICTED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Giới hạn tốc độ: gửi 2 tin liên tiếp -> RATE_LIMIT_EXCEEDED")
        void sendMessage_rateLimit_shouldThrow() {
            User sender = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, sender, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            chatService.sendMessage("s", null, "hi", MessageType.TEXT, null, null, null, sender);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("s", null, "hi2", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.RATE_LIMIT_EXCEEDED, ex.getErrorCode());
        }

        @Test
        @DisplayName("sessionId null và listingId null -> INVALID_INPUT")
        void sendMessage_missingSessionAndListing_shouldThrow() {
            User sender = user(1L, "a@ex.com");
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage(null, null, "hi", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Tin nhắn TEXT nhưng content rỗng -> INVALID_INPUT")
        void sendMessage_blankText_shouldThrow() {
            User sender = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, sender, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.sendMessage("s", null, "  ", MessageType.TEXT, null, null, null, sender));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: lưu message + gửi thông báo + broadcast (WS)")
        void sendMessage_happyPath_shouldNotifyAndBroadcast() {
            User sender = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, sender, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
                Message m = invocation.getArgument(0);
                m.setId(99L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ChatMessageResponse out = chatService.sendMessage("s", null, "hello", MessageType.TEXT, null, null, null, sender);
            assertNotNull(out);
            assertEquals("hello", out.getContent());

            verify(notificationService).notifyNewMessage(eq(other), any(ChatMessageResponse.class), eq("s"));
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }
    }

    // =========================================================================
    // uploadChatImage
    // =========================================================================
    @Nested
    @DisplayName("Upload ảnh trong chat (uploadChatImage)")
    class UploadChatImage {

        @Test
        @DisplayName("sessionId null và listingId null -> INVALID_INPUT")
        void uploadChatImage_missingSessionAndListing_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.uploadChatImage(null, null, new MockMultipartFile("f", new byte[1])));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("File quá lớn -> FILE_TOO_LARGE")
        void uploadChatImage_tooLarge_shouldThrow() {
            User current = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, current, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);

            MockMultipartFile f = new MockMultipartFile("file", "a.png", "image/png", new byte[(int) (Constants.MAX_CHAT_IMAGE_BYTES + 1)]);
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.uploadChatImage("s", null, f));
            assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
        }

        @Test
        @DisplayName("Sai content-type -> INVALID_FILE_TYPE")
        void uploadChatImage_invalidType_shouldThrow() {
            User current = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, current, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);

            MockMultipartFile f = new MockMultipartFile("file", "a.gif", "image/gif", new byte[10]);
            SlifeException ex = assertThrows(SlifeException.class, () -> chatService.uploadChatImage("s", null, f));
            assertEquals(ErrorCode.INVALID_FILE_TYPE, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính -> trả về URL upload ảnh")
        void uploadChatImage_happyPath_shouldReturnUrl() {
            User current = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, current, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(userService.getCurrentUser()).thenReturn(current);

            MockMultipartFile f = new MockMultipartFile("file", "a.png", "image/png", new byte[10]);
            String url = chatService.uploadChatImage("s", null, f);
            assertNotNull(url);
            assertTrue(url.contains("/uploads/" + Constants.CHAT_UPLOAD_DIR + "/s/"));
        }
    }

    // =========================================================================
    // makeOffer
    // =========================================================================
    @Nested
    @DisplayName("Trả giá trong chat (makeOffer(sessionId, amount, buyer))")
    class MakeOfferInChat {

        @Test
        @DisplayName("Giá trả không hợp lệ -> OFFER_PRICE_INVALID")
        void makeOffer_invalidPrice_shouldThrow() {
            User buyer = user(1L, "a@ex.com");
            User seller = user(2L, "b@ex.com");
            Listing l = listing(10L, seller);
            Conversation c = conv(1L, "s", l, buyer, seller);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.makeOffer("s", BigDecimal.ZERO, buyer));
            assertEquals(ErrorCode.OFFER_PRICE_INVALID, ex.getErrorCode());
        }

        @Test
        @DisplayName("Đã có offer PENDING -> INVALID_INPUT")
        void makeOffer_pendingExists_shouldThrow() {
            User buyer = user(1L, "a@ex.com");
            User seller = user(2L, "b@ex.com");
            Listing l = listing(10L, seller);
            Conversation c = conv(1L, "s", l, buyer, seller);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(1L);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.makeOffer("s", new BigDecimal("1"), buyer));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính -> tạo Offer + message OFFER_PROPOSAL + gửi thông báo/email + broadcast (WS)")
        void makeOffer_happyPath_shouldSaveOfferAndMessage() {
            User buyer = user(1L, "a@ex.com");
            User seller = user(2L, "b@ex.com");
            Listing l = listing(10L, seller);
            Conversation c = conv(1L, "s", l, buyer, seller);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(0L);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
                Offer o = invocation.getArgument(0);
                o.setId(77L);
                return o;
            });
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
                Message m = invocation.getArgument(0);
                m.setId(88L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ChatMessageResponse out = chatService.makeOffer("s", new BigDecimal("900"), buyer);
            assertNotNull(out);
            assertEquals(MessageType.OFFER_PROPOSAL, out.getMessageType());

            verify(notificationService).notifyOfferProposal(eq(seller), eq(buyer), eq(10L), eq("Listing 10"), eq(new BigDecimal("900")));
            verify(systemEmailService).sendOfferProposalEmail(eq(seller), anyString(), eq("Listing 10"), eq(10L), eq(new BigDecimal("900")));
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }
    }

    @Test
    @DisplayName("Trả giá theo listingId: tự mở chat rồi gọi makeOffer(sessionId)")
    void makeOffer_byListing_shouldReuseSession() {
        User buyer = user(1L, "a@ex.com");
        User seller = user(2L, "b@ex.com");
        Listing l = listing(10L, seller);
        Conversation c = conv(1L, "s", l, buyer, seller);

        ChatService spy = spy(chatService);
        doReturn(c).when(spy).getOrCreateSession(10L, buyer);
        doReturn(new ChatMessageResponse()).when(spy).makeOffer(eq("s"), any(), eq(buyer));

        spy.makeOffer(10L, new BigDecimal("1"), buyer);
        verify(spy).makeOffer(eq("s"), eq(new BigDecimal("1")), eq(buyer));
    }

    // =========================================================================
    // respondToOffer
    // =========================================================================
    @Nested
    @DisplayName("Phản hồi offer (respondToOffer)")
    class RespondToOffer {

        @Test
        @DisplayName("Không tìm thấy offer -> OFFER_NOT_FOUND")
        void respond_offerNotFound_shouldThrow() {
            when(offerRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.respondToOffer(1L, "ACCEPTED", user(2L, "s@ex.com")));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Offer không PENDING -> OFFER_NOT_PENDING")
        void respond_notPending_shouldThrow() {
            Offer o = new Offer();
            o.setId(1L);
            o.setStatus(OfferService.STATUS_ACCEPTED);
            when(offerRepository.findById(1L)).thenReturn(Optional.of(o));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.respondToOffer(1L, "ACCEPTED", user(2L, "s@ex.com")));
            assertEquals(ErrorCode.OFFER_NOT_PENDING, ex.getErrorCode());
        }

        @Test
        @DisplayName("Seller trùng buyer -> FORBIDDEN")
        void respond_sellerIsBuyer_shouldThrow() {
            User buyer = user(1L, "b@ex.com");
            User seller = buyer;
            Listing l = listing(10L, user(99L, "x@ex.com"));
            Conversation c = conv(1L, "s", l, buyer, user(2L, "o@ex.com"));
            Offer o = new Offer();
            o.setId(1L);
            o.setStatus(OfferService.STATUS_PENDING);
            o.setBuyer(buyer);
            o.setListing(l);
            o.setConversation(c);
            when(offerRepository.findById(1L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> chatService.respondToOffer(1L, "ACCEPTED", seller));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("ACCEPTED: cập nhật offer + tạo tin hệ thống DEAL_CONFIRMATION + gửi thông báo/email + broadcast OFFER_STATUS")
        void respond_accepted_shouldNotifyAndBroadcast() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Listing l = listing(10L, seller);
            Conversation c = conv(1L, "s", l, buyer, seller);

            Offer o = new Offer();
            o.setId(1L);
            o.setStatus(OfferService.STATUS_PENDING);
            o.setBuyer(buyer);
            o.setListing(l);
            o.setConversation(c);
            o.setAmount(new BigDecimal("900"));

            when(offerRepository.findById(1L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
                Message m = invocation.getArgument(0);
                m.setId(99L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ChatMessageResponse res = chatService.respondToOffer(1L, "ACCEPTED", seller);
            assertNotNull(res);

            verify(notificationService).notifyDealConfirmed(eq(buyer), eq(seller), eq(10L), eq("Listing 10"), eq(1L));
            verify(systemEmailService).sendOfferAcceptedEmails(eq(buyer), eq(seller), eq("Listing 10"), eq(10L), eq(1L));
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }

        @Test
        @DisplayName("REJECTED: cập nhật offer + tạo tin nhắn text + gửi thông báo/email")
        void respond_rejected_shouldNotify() {
            User buyer = user(1L, "b@ex.com");
            User seller = user(2L, "s@ex.com");
            Listing l = listing(10L, seller);
            Conversation c = conv(1L, "s", l, buyer, seller);

            Offer o = new Offer();
            o.setId(1L);
            o.setStatus(OfferService.STATUS_PENDING);
            o.setBuyer(buyer);
            o.setListing(l);
            o.setConversation(c);
            o.setAmount(new BigDecimal("900"));

            when(offerRepository.findById(1L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
                Message m = invocation.getArgument(0);
                m.setId(99L);
                return m;
            });
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ChatMessageResponse res = chatService.respondToOffer(1L, "REJECTED", seller);
            assertNotNull(res);

            verify(notificationService).notifyOfferRejected(eq(buyer), eq(seller), eq(10L), eq("Listing 10"), eq(new BigDecimal("900")));
            verify(systemEmailService).sendOfferRejectedEmail(eq(buyer), anyString(), eq("Listing 10"), eq(10L), eq(new BigDecimal("900")));
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }
    }

    // =========================================================================
    // markSessionAsRead / broadcastTyping / getQuickReplies
    // =========================================================================
    @Nested
    @DisplayName("Đánh dấu đã đọc (markSessionAsRead)")
    class MarkSessionAsRead {

        @Test
        @DisplayName("updated=0 -> không phát (broadcast) sự kiện READ")
        void markRead_noUpdates_shouldNotBroadcast() {
            User me = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, me, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.markAllReadInConversation(1L, 1L)).thenReturn(0);
            chatService.markSessionAsRead("s", me);
            verify(messagingTemplate, never()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }

        @Test
        @DisplayName("updated>0 -> phát (broadcast) sự kiện READ")
        void markRead_updates_shouldBroadcast() {
            User me = user(1L, "a@ex.com");
            User other = user(2L, "b@ex.com");
            Listing l = listing(10L, other);
            Conversation c = conv(1L, "s", l, me, other);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(c));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(messageRepository.markAllReadInConversation(1L, 1L)).thenReturn(2);
            chatService.markSessionAsRead("s", me);
            verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/chat.s"), any(Object.class));
        }
    }

    @Test
    @DisplayName("Gõ đang nhập (broadcastTyping) -> broadcast sự kiện")
    void broadcastTyping_shouldBroadcast() {
        chatService.broadcastTyping("s", "a@ex.com", true);
        verify(messagingTemplate).convertAndSend(eq("/topic/chat.s"), any(Object.class));
    }

    @Test
    @DisplayName("getQuickReplies -> trả về danh sách không null")
    void getQuickReplies_shouldReturnList() {
        assertNotNull(chatService.getQuickReplies());
    }
}

