package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateOfferRequest;
import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.response.OfferResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.OfferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock private OfferRepository offerRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private DealRepository dealRepository;
    @Mock private DealService dealService;
    @Mock private UserService userService;
    @Mock private NotificationService notificationService;
    @Mock private SystemEmailService systemEmailService;
    @Mock private BlockService blockService;

    private OfferService offerService;

    @BeforeEach
    void setUp() {
        offerService = new OfferService(
                offerRepository,
                listingRepository,
                conversationRepository,
                dealRepository,
                dealService,
                userService,
                notificationService,
                systemEmailService,
                blockService
        );
        lenient().doNothing().when(dealService).lockAndPrepareExclusiveBuyerDealOnListing(anyLong(), anyLong());
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@example.com");
        u.setFullName("U" + id);
        return u;
    }

    private static Listing listing(long id, User seller, String status, BigDecimal price) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setStatus(status);
        l.setPrice(price);
        l.setTitle("T" + id);
        return l;
    }

    private static Offer offer(long id, Listing listing, User buyer, String status, BigDecimal amount) {
        Offer o = new Offer();
        o.setId(id);
        o.setListing(listing);
        o.setBuyer(buyer);
        o.setAmount(amount);
        o.setStatus(status);
        return o;
    }

    private static Conversation conversation(long id, Listing listing, User u1, User u2) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setListing(listing);
        c.setUserId1(u1);
        c.setUserId2(u2);
        c.setStatus(Conversation.STATUS_ACTIVE);
        return c;
    }

    // =========================================================================
    // createOfferForListing — core business rules
    // =========================================================================
    @Nested
    @DisplayName("Tạo trả giá từ trang tin (createOfferForListing)")
    class CreateOfferForListing {

        @Test
        @DisplayName("[Thường] Luồng chính: listing ACTIVE + đề xuất hợp lệ → tạo offer PENDING + notify + email")
        void createOfferForListing_happyPath_shouldCreatePendingOfferAndNotify() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(0L);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
                Offer o = invocation.getArgument(0);
                o.setId(999L);
                return o;
            });

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));

            OfferResponse res = offerService.createOfferForListing(10L, req);
            assertNotNull(res);
            assertEquals(999L, res.getId());
            assertEquals("PENDING", res.getStatus());

            ArgumentCaptor<Offer> captor = ArgumentCaptor.forClass(Offer.class);
            verify(offerRepository).save(captor.capture());
            Offer saved = captor.getValue();
            assertEquals(buyer.getId(), saved.getBuyer().getId());
            assertEquals(l.getId(), saved.getListing().getId());
            assertEquals(new BigDecimal("900"), saved.getAmount());
            assertEquals("PENDING", saved.getStatus());
            assertNotNull(saved.getCreatedAt());
            assertNotNull(saved.getUpdatedAt());

            verify(notificationService).notifyOfferProposal(eq(seller), eq(buyer), eq(10L), eq("T10"), eq(new BigDecimal("900")));
            verify(systemEmailService).sendOfferProposalEmail(eq(seller), anyString(), eq("T10"), eq(10L), eq(new BigDecimal("900")));
        }

        @Test
        @DisplayName("[Lỗi] Không tìm thấy tin đăng → LISTING_NOT_FOUND")
        void createOfferForListing_listingNotFound_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(404L, new CreateOfferRequest()));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Listing không ACTIVE → INVALID_INPUT")
        void createOfferForListing_notActive_shouldThrow() {
            User buyer = user(1L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, user(2L), "HIDDEN", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, new CreateOfferRequest()));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Buyer là seller → INVALID_INPUT")
        void createOfferForListing_selfOffer_shouldThrow() {
            User buyer = user(1L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, buyer, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Bị block → FOLLOW_BLOCKED")
        void createOfferForListing_blocked_shouldThrow() {
            User buyer = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Giá đề xuất null/<=0 → INVALID_INPUT")
        void createOfferForListing_invalidProposed_shouldThrow() {
            User buyer = user(1L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, user(2L), "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("0"));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Giá đề xuất >= giá listing → INVALID_INPUT")
        void createOfferForListing_proposedTooHigh_shouldThrow() {
            User buyer = user(1L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, user(2L), "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("1000"));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Đã có offer PENDING → INVALID_INPUT")
        void createOfferForListing_pendingExists_shouldThrow() {
            User buyer = user(1L);
            when(userService.getCurrentUser()).thenReturn(buyer);
            Listing l = listing(10L, user(2L), "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(1L);

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // makeOffer(MakeOfferRequest) — guard rail
    // =========================================================================
    @Test
    @DisplayName("makeOffer(MakeOfferRequest) luôn throw để ép dùng ChatService")
    void makeOffer_request_overload_shouldThrowInvalidInput() {
        SlifeException ex = assertThrows(SlifeException.class, () -> offerService.makeOffer(new MakeOfferRequest()));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    // =========================================================================
    // getOfferHistory — basic access control
    // =========================================================================
    @Nested
    @DisplayName("Lịch sử trả giá (getOfferHistory)")
    class GetOfferHistory {

        @Test
        @DisplayName("[Lỗi] listingId null và sessionId blank → INVALID_INPUT")
        void getOfferHistory_missingListingAndSession_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOfferHistory(null, null, "   ", 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải seller, buyerId != currentUser → FORBIDDEN")
        void getOfferHistory_notSeller_otherBuyerId_shouldThrowForbidden() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOfferHistory(10L, 999L, null, 0, 10));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Người bán xem lịch sử: buyerId null → truy vấn theo listingId")
        void getOfferHistory_sellerWithoutBuyerId_shouldQueryListingOnly() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            when(offerRepository.findByListing_IdOrderByCreatedAtDesc(eq(10L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            PagedResponse<OfferResponse> res = offerService.getOfferHistory(10L, null, null, 0, 10);
            assertNotNull(res);
            verify(offerRepository).findByListing_IdOrderByCreatedAtDesc(eq(10L), any(Pageable.class));
        }

        @Test
        @DisplayName("Có sessionId nhưng listingId đã có → vẫn query theo listingId (không đụng conversationRepository)")
        void getOfferHistory_sessionProvided_listingProvided_shouldNotTouchConversationRepository() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));
            when(offerRepository.findByListing_IdOrderByCreatedAtDesc(eq(10L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            offerService.getOfferHistory(10L, null, "sess", 0, 10);
            verifyNoInteractions(conversationRepository);
        }

        @Test
        @DisplayName("[Lỗi] Chế độ sessionId: không thuộc hội thoại và cũng không phải người bán → NOT_CHAT_PARTICIPANT")
        void getOfferHistory_sessionMode_notParticipant_shouldThrowNotChatParticipant() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Listing listing = listing(10L, user(99L), "ACTIVE", new BigDecimal("1000"));
            Conversation conv = conversation(5L, listing, user(2L), user(3L));
            when(conversationRepository.findBySessionUuid("sess")).thenReturn(Optional.of(conv));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOfferHistory(null, null, "sess", 0, 10));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Chế độ sessionId: buyerId truyền vào không khớp buyer của session → FORBIDDEN")
        void getOfferHistory_sessionMode_buyerMismatch_shouldThrowForbidden() {
            User seller = user(99L);
            User buyer = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Conversation conv = conversation(5L, listing, buyer, seller);
            when(conversationRepository.findBySessionUuid("sess")).thenReturn(Optional.of(conv));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOfferHistory(null, 12345L, "sess", 0, 10));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Chế độ sessionId: không dùng được / lỗi dữ liệu → INVALID_INPUT (yêu cầu query theo listingId)")
        void getOfferHistory_sessionMode_chatSessionNotFound_shouldMapToInvalidInput() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(conversationRepository.findBySessionUuid("sess")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOfferHistory(null, null, "sess", 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // =========================================================================
    // makeOffer(sessionId, amount) — backward compatible flow
    // =========================================================================
    @Nested
    @DisplayName("Trả giá theo session chat (makeOffer(sessionId, amount))")
    class MakeOfferBySession {

        @Test
        @DisplayName("[Lỗi] Không thuộc hội thoại → NOT_CHAT_PARTICIPANT")
        void makeOffer_notParticipant_shouldThrow() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            User u1 = user(2L);
            User u2 = user(3L);
            conv.setUserId1(u1);
            conv.setUserId2(u2);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Giá không hợp lệ → INVALID_INPUT")
        void makeOffer_invalidAmount_shouldThrow() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            User other = user(2L);
            conv.setUserId2(other);
            Listing l = listing(10L, other, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", BigDecimal.ZERO));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không tìm thấy session → CHAT_SESSION_NOT_FOUND")
        void makeOffer_sessionNotFound_shouldThrowChatSessionNotFound() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.CHAT_SESSION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Session có participant nhưng thiếu listing → LISTING_NOT_FOUND")
        void makeOffer_sessionMissingListing_shouldThrowListingNotFound() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            conv.setUserId2(user(2L));
            conv.setListing(null);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Giá đề xuất >= giá listing → INVALID_INPUT")
        void makeOffer_amountTooHigh_shouldThrow() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            conv.setUserId2(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1000")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Buyer là seller → INVALID_INPUT")
        void makeOffer_selfOffer_shouldThrow() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            conv.setUserId2(user(2L));
            Listing l = listing(10L, current, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Bị block → FOLLOW_BLOCKED")
        void makeOffer_blocked_shouldThrow() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            conv.setUserId2(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Đã có offer PENDING → INVALID_INPUT")
        void makeOffer_pendingExists_shouldThrow() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setUserId1(current);
            conv.setUserId2(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(1L);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.makeOffer("s", new BigDecimal("1")));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: lưu Offer PENDING với conversation")
        void makeOffer_happyPath_shouldSavePendingOffer() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Conversation conv = new Conversation();
            conv.setId(55L);
            conv.setUserId1(current);
            conv.setUserId2(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            conv.setListing(l);
            when(conversationRepository.findBySessionUuid("s")).thenReturn(Optional.of(conv));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(0L);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
                Offer o = invocation.getArgument(0);
                o.setId(999L);
                return o;
            });

            Offer saved = offerService.makeOffer("s", new BigDecimal("900"));
            assertEquals(999L, saved.getId());
            assertEquals("PENDING", saved.getStatus());
            assertNotNull(saved.getConversation());
            assertEquals(55L, saved.getConversation().getId());
            assertEquals(10L, saved.getListing().getId());
            assertEquals(1L, saved.getBuyer().getId());
        }
    }

    // =========================================================================
    // getOffersForListing — seller-only view + block filtering
    // =========================================================================
    @Nested
    @DisplayName("Người bán xem danh sách offers của một tin (getOffersForListing)")
    class GetOffersForListing {

        @Test
        @DisplayName("[Lỗi] listingId null → INVALID_INPUT")
        void getOffersForListing_nullListingId_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOffersForListing(null, 0, 10));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không tìm thấy tin đăng → LISTING_NOT_FOUND")
        void getOffersForListing_listingNotFound_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findById(10L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOffersForListing(10L, 0, 10));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải seller → FORBIDDEN")
        void getOffersForListing_notSeller_shouldThrowForbidden() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing(10L, seller, "ACTIVE", new BigDecimal("1000"))));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.getOffersForListing(10L, 0, 10));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Người bán xem offers: lọc buyer bị block")
        void getOffersForListing_seller_shouldFilterBlockedBuyers() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(l));

            User buyerOk = user(1L);
            User buyerBlocked = user(3L);
            Offer ok = offer(1L, l, buyerOk, OfferService.STATUS_PENDING, new BigDecimal("900"));
            Offer blocked = offer(2L, l, buyerBlocked, OfferService.STATUS_PENDING, new BigDecimal("800"));
            Offer anonymous = offer(3L, l, null, OfferService.STATUS_PENDING, new BigDecimal("700"));
            when(offerRepository.findByListing_IdOrderByCreatedAtDesc(eq(10L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(ok, blocked, anonymous)));
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(true);

            PagedResponse<OfferResponse> res = offerService.getOffersForListing(10L, -1, 999);
            assertNotNull(res);
            assertEquals(2, res.getContent().size());
            assertTrue(res.getContent().stream().anyMatch(r -> r.getId().equals(1L)));
            assertTrue(res.getContent().stream().anyMatch(r -> r.getId().equals(3L)));
        }
    }

    // =========================================================================
    // acceptOffer(Long offerId, String sessionId) — legacy seller-accept flow
    // =========================================================================
    @Nested
    @DisplayName("Chấp nhận offer (legacy: acceptOffer(offerId, sessionId))")
    class AcceptOfferLegacy {

        @Test
        @DisplayName("[Lỗi] Không tìm thấy offer → OFFER_NOT_FOUND")
        void acceptOfferLegacy_offerNotFound_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(offerRepository.findById(9L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L, "s"));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải seller → NOT_CHAT_PARTICIPANT")
        void acceptOfferLegacy_notSeller_shouldThrow() {
            User current = user(1L);
            when(userService.getCurrentUser()).thenReturn(current);
            Listing l = listing(10L, user(2L), "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L, "s"));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Offer không PENDING → INVALID_INPUT")
        void acceptOfferLegacy_notPending_shouldThrow() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_REJECTED, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L, "s"));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Buyer bị block → OFFER_NOT_FOUND")
        void acceptOfferLegacy_blockedBuyer_shouldThrowOfferNotFound() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L, "s"));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: chấp nhận (legacy) → cập nhật offer + tạo deal + gửi thông báo/email")
        void acceptOfferLegacy_happyPath_shouldCreateDealAndNotify() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(false);

            Conversation existingConv = conversation(77L, l, buyer, seller);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 3L, 2L))
                    .thenReturn(Optional.of(existingConv));
            when(dealRepository.save(any(Deal.class))).thenAnswer(invocation -> {
                Deal d = invocation.getArgument(0);
                d.setId(555L);
                return d;
            });

            Deal deal = offerService.acceptOffer(9L, "ignored");
            assertNotNull(deal);
            assertEquals("PENDING", deal.getStatus());
            assertEquals(10L, deal.getListing().getId());
            assertEquals(3L, deal.getBuyer().getId());
            assertEquals(9L, deal.getOffer().getId());

            verify(notificationService).notifyDealConfirmed(eq(buyer), eq(seller), eq(10L), eq("T10"), eq(77L));
            verify(systemEmailService).sendOfferAcceptedEmails(eq(buyer), eq(seller), eq("T10"), eq(10L), eq(77L), any());
            verify(offerRepository).save(argThat(saved -> OfferService.STATUS_ACCEPTED.equals(saved.getStatus())));
        }
    }

    // =========================================================================
    // acceptOffer(Long offerId) — seller accept from listing
    // =========================================================================
    @Nested
    @DisplayName("Chấp nhận offer (acceptOffer(offerId))")
    class AcceptOffer {

        @Test
        @DisplayName("[Lỗi] Không tìm thấy offer → OFFER_NOT_FOUND")
        void acceptOffer_offerNotFound_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(offerRepository.findById(9L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Offer thiếu listing → LISTING_NOT_FOUND")
        void acceptOffer_missingListing_shouldThrowListingNotFound() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            Offer o = new Offer();
            o.setId(9L);
            o.setListing(null);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải seller → FORBIDDEN")
        void acceptOffer_notSeller_shouldThrowForbidden() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Offer không PENDING → OFFER_NOT_PENDING")
        void acceptOffer_notPending_shouldThrowOfferNotPending() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_REJECTED, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_PENDING, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Buyer bị block → OFFER_NOT_FOUND")
        void acceptOffer_blockedBuyer_shouldThrowOfferNotFound() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: chấp nhận → từ chối các pending khác + tạo deal + gửi thông báo/email")
        void acceptOffer_happyPath_shouldAcceptAndRejectOthersAndNotify() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer accepted = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(accepted));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(false);

            Offer other1 = offer(10L, l, user(4L), OfferService.STATUS_PENDING, new BigDecimal("850"));
            Offer other2 = offer(11L, l, user(5L), OfferService.STATUS_PENDING, new BigDecimal("800"));
            when(offerRepository.findByListing_IdAndStatusOrderByCreatedAtDesc(10L, OfferService.STATUS_PENDING))
                    .thenReturn(List.of(accepted, other1, other2));

            Conversation existingConv = conversation(77L, l, buyer, seller);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 3L, 2L))
                    .thenReturn(Optional.of(existingConv));
            when(dealRepository.save(any(Deal.class))).thenAnswer(invocation -> invocation.getArgument(0));

            OfferResponse res = offerService.acceptOffer(9L);
            assertNotNull(res);
            assertEquals("ACCEPTED", res.getStatus());

            verify(offerRepository).save(argThat(saved -> OfferService.STATUS_ACCEPTED.equals(saved.getStatus())));
            verify(offerRepository).saveAll(argThat(iterable -> {
                boolean rejected10 = false;
                boolean rejected11 = false;
                for (Offer o : iterable) {
                    if (o != null && o.getId() != null) {
                        if (o.getId().equals(10L) && OfferService.STATUS_REJECTED.equals(o.getStatus())) rejected10 = true;
                        if (o.getId().equals(11L) && OfferService.STATUS_REJECTED.equals(o.getStatus())) rejected11 = true;
                    }
                }
                return rejected10 && rejected11;
            }));
            verify(notificationService).notifyDealConfirmed(eq(buyer), eq(seller), eq(10L), eq("T10"), eq(77L));
            verify(systemEmailService).sendOfferAcceptedEmails(eq(buyer), eq(seller), eq("T10"), eq(10L), eq(77L), any());
        }
    }

    // =========================================================================
    // rejectOffer(Long offerId) — seller rejects
    // =========================================================================
    @Nested
    @DisplayName("Từ chối offer (rejectOffer(offerId))")
    class RejectOffer {

        @Test
        @DisplayName("[Lỗi] Không tìm thấy offer → OFFER_NOT_FOUND")
        void rejectOffer_offerNotFound_shouldThrow() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(offerRepository.findById(9L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Offer thiếu listing → LISTING_NOT_FOUND")
        void rejectOffer_missingListing_shouldThrowListingNotFound() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            Offer o = new Offer();
            o.setId(9L);
            o.setListing(null);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không phải seller → FORBIDDEN")
        void rejectOffer_notSeller_shouldThrowForbidden() {
            User current = user(1L);
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(current);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Offer không PENDING → OFFER_NOT_PENDING")
        void rejectOffer_notPending_shouldThrowOfferNotPending() {
            User seller = user(2L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, user(3L), OfferService.STATUS_ACCEPTED, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_PENDING, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Buyer bị block → OFFER_NOT_FOUND")
        void rejectOffer_blockedBuyer_shouldThrowOfferNotFound() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(true);

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: từ chối → cập nhật offer + gửi thông báo/email")
        void rejectOffer_happyPath_shouldRejectAndNotify() {
            User seller = user(2L);
            User buyer = user(3L);
            when(userService.getCurrentUser()).thenReturn(seller);
            Listing l = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, l, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

            OfferResponse res = offerService.rejectOffer(9L);
            assertNotNull(res);
            assertEquals("REJECTED", res.getStatus());

            verify(notificationService).notifyOfferRejected(eq(buyer), eq(seller), eq(10L), eq("T10"), eq(new BigDecimal("900")));
            verify(systemEmailService).sendOfferRejectedEmails(eq(buyer), eq(seller), eq("T10"), eq(10L), eq(new BigDecimal("900")));
            verify(offerRepository).save(argThat(saved -> OfferService.STATUS_REJECTED.equals(saved.getStatus())));
        }
    }
}

