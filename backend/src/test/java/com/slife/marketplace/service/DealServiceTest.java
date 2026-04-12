package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.request.FinalizeDealRequest;
import com.slife.marketplace.dto.request.SealDealRequest;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.OfferRepository;
import com.slife.marketplace.repository.ReviewRepository;
import com.slife.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static com.slife.marketplace.service.DealService.STATUS_CANCELLED;
import static com.slife.marketplace.service.DealService.STATUS_COMPLETED;
import static com.slife.marketplace.service.DealService.STATUS_CONFIRMED;
import static com.slife.marketplace.service.DealService.STATUS_PENDING;
import static com.slife.marketplace.service.DealService.STATUS_REJECTED;
import static com.slife.marketplace.service.DealService.STATUS_SUCCESS;
import static com.slife.marketplace.service.OfferService.STATUS_ACCEPTED;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private ListingImageRepository listingImageRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserService userService;
    @Mock private NotificationService notificationService;
    @Mock private BlockService blockService;
    @Mock private SystemEmailService systemEmailService;
    @Mock private ConfigService configService;

    private DealService dealService;

    @BeforeEach
    void setUp() {
        dealService = new DealService(
                dealRepository,
                listingImageRepository,
                listingRepository,
                conversationRepository,
                offerRepository,
                addressRepository,
                reviewRepository,
                userRepository,
                userService,
                notificationService,
                blockService,
                systemEmailService,
                configService
        );
        lenient().when(configService.getIntConfigValue(anyString(), anyInt())).thenAnswer(inv -> inv.getArgument(1));
        lenient().when(configService.getConfigValue(anyString())).thenReturn(null);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setFullName("U" + id);
        u.setEmail("u" + id + "@e.com");
        return u;
    }

    private static Listing listing(long id, User seller, BigDecimal price, boolean giveaway) {
        Listing l = new Listing();
        l.setId(id);
        l.setSeller(seller);
        l.setPrice(price);
        l.setIsGiveaway(giveaway);
        l.setTitle("T" + id);
        l.setStatus("ACTIVE");
        return l;
    }

    private static Conversation conversation(long id, Listing listing, User u1, User u2) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setListing(listing);
        c.setUserId1(u1);
        c.setUserId2(u2);
        c.setStatus(Conversation.STATUS_ACTIVE);
        c.setCreatedAt(Instant.now());
        c.ensureSessionUuid();
        return c;
    }

    private static Deal dealEntity(long id, User buyer, Listing listing, Conversation conv, String status) {
        Deal d = new Deal();
        d.setId(id);
        d.setBuyer(buyer);
        d.setListing(listing);
        d.setConversation(conv);
        d.setStatus(status);
        d.setOfferedPrice(new BigDecimal("100.00"));
        d.setReminderSent(false);
        d.setCreatedAt(LocalDateTime.now().minusDays(1));
        d.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return d;
    }

    private static Offer offer(long id, Listing listing, User buyer, BigDecimal amount, String status) {
        Offer o = new Offer();
        o.setId(id);
        o.setListing(listing);
        o.setBuyer(buyer);
        o.setAmount(amount);
        o.setStatus(status);
        return o;
    }

    private void stubReviewLookupFalse(Deal d) {
        when(reviewRepository.existsReviewCreatedAfter(
                anyLong(), anyLong(), any(Instant.class))).thenReturn(false);
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Tạo deal từ tin (createDeal)")
    class CreateDeal {

        @Test
        @DisplayName("[Lỗi] Listing không tồn tại → LISTING_NOT_FOUND")
        void listingMissing() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.empty());
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));
            assertThrows(SlifeException.class, () -> dealService.createDeal(10L, req));
        }

        @Test
        @DisplayName("[Lỗi] Không thể tạo deal cho chính tin của mình → INVALID_INPUT")
        void selfSeller() {
            User u = user(2L);
            Listing l = listing(10L, u, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(u);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));
            SlifeException ex = assertThrows(SlifeException.class, () -> dealService.createDeal(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Block với seller → FOLLOW_BLOCKED")
        void blocked() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));
            assertEquals(ErrorCode.FOLLOW_BLOCKED,
                    assertThrows(SlifeException.class, () -> dealService.createDeal(10L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Tin giveaway / giá 0 → INVALID_INPUT")
        void giveawayListing() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, BigDecimal.ZERO, true);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("0"));
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.createDeal(10L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: tạo deal PENDING + offer + conversation có sẵn")
        void happyPath() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("500"), false);
            Conversation conv = conversation(50L, l, buyer, seller);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.of(conv));
            when(offerRepository.findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
                    eq(10L), eq(1L), eq(new BigDecimal("400")), anyList())).thenReturn(Optional.empty());
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
                Offer o = inv.getArgument(0);
                o.setId(700L);
                return o;
            });
            when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> {
                Deal d = inv.getArgument(0);
                if (d.getCreatedAt() == null) {
                    d.setCreatedAt(LocalDateTime.now());
                }
                if (d.getUpdatedAt() == null) {
                    d.setUpdatedAt(LocalDateTime.now());
                }
                d.setId(300L);
                return d;
            });
            stubReviewLookupFalse(null);

            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("400"));
            DealResponse res = dealService.createDeal(10L, req);

            assertEquals(300L, res.getDealId());
            assertEquals(STATUS_PENDING, res.getStatus());
            verify(dealRepository).save(any(Deal.class));
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Người bán chốt đơn trong chat (sealDealBySeller)")
    class SealDealBySeller {

        @Test
        @DisplayName("[Lỗi] Không phải chủ tin → FORBIDDEN")
        void notSeller() {
            User stranger = user(9L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> dealService.sealDealBySeller(10L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Không có hội thoại active với buyer → CHAT_SESSION_NOT_FOUND")
        void noConversation() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(userService.getUserById(1L)).thenReturn(buyer);
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(conversationRepository.findActiveByListingBuyerSeller(10L, 1L, 2L)).thenReturn(Optional.empty());
            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));
            assertEquals(ErrorCode.CHAT_SESSION_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> dealService.sealDealBySeller(10L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] pickupTime không sau hiện tại → INVALID_INPUT")
        void pickupInPast() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(userService.getUserById(1L)).thenReturn(buyer);
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(conversationRepository.findActiveByListingBuyerSeller(10L, 1L, 2L)).thenReturn(Optional.of(conversation(1L, l, buyer, seller)));
            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));
            req.setPickupTime(Instant.now().minus(1, ChronoUnit.HOURS));
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.sealDealBySeller(10L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: tạo deal PENDING mới khi chưa có deal pending")
        void newPendingDeal() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Conversation conv = conversation(88L, l, buyer, seller);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(userService.getUserById(1L)).thenReturn(buyer);
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(conversationRepository.findActiveByListingBuyerSeller(10L, 1L, 2L)).thenReturn(Optional.of(conv));
            when(offerRepository.findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
                    eq(10L), eq(1L), eq(new BigDecimal("50")), anyList()))
                    .thenReturn(Optional.of(offer(5L, l, buyer, new BigDecimal("50"), STATUS_PENDING)));
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.empty());
            when(conversationRepository.findActiveByListingAndParticipants(10L, 1L, 2L)).thenReturn(Optional.of(conv));
            when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> {
                Deal d = inv.getArgument(0);
                if (d.getCreatedAt() == null) {
                    d.setCreatedAt(LocalDateTime.now());
                }
                if (d.getUpdatedAt() == null) {
                    d.setUpdatedAt(LocalDateTime.now());
                }
                d.setId(400L);
                return d;
            });
            stubReviewLookupFalse(null);

            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));
            req.setPickupTime(Instant.now().plus(1, ChronoUnit.DAYS));

            DealResponse res = dealService.sealDealBySeller(10L, req);
            assertEquals(400L, res.getDealId());
            assertEquals(STATUS_PENDING, res.getStatus());
        }

        @Test
        @DisplayName("Đã có deal PENDING cùng buyer → cập nhật giá và offer")
        void updateExistingPending() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Conversation conv = conversation(88L, l, buyer, seller);
            Deal existing = dealEntity(55L, buyer, l, conv, STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(userService.getUserById(1L)).thenReturn(buyer);
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(conversationRepository.findActiveByListingBuyerSeller(10L, 1L, 2L)).thenReturn(Optional.of(conv));
            when(offerRepository.findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
                    eq(10L), eq(1L), eq(new BigDecimal("60")), anyList()))
                    .thenReturn(Optional.of(offer(6L, l, buyer, new BigDecimal("60"), STATUS_ACCEPTED)));
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.of(existing));
            when(dealRepository.save(existing)).thenReturn(existing);
            stubReviewLookupFalse(existing);

            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("60"));

            DealResponse res = dealService.sealDealBySeller(10L, req);
            assertEquals(55L, res.getDealId());
            assertEquals(0, new BigDecimal("60").compareTo(existing.getOfferedPrice()));
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Người mua chấp nhận / từ chối deal PENDING")
    class BuyerPendingActions {

        @Test
        @DisplayName("[Lỗi] buyerAccept: không có deal PENDING → DEAL_NOT_FOUND")
        void acceptMissing() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.empty());
            assertEquals(ErrorCode.DEAL_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> dealService.buyerAcceptPendingDeal(10L)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] buyerAccept: block với seller → DEAL_NOT_FOUND")
        void acceptBlocked() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Conversation conv = conversation(1L, l, buyer, seller);
            Deal d = dealEntity(1L, buyer, l, conv, STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            assertEquals(ErrorCode.DEAL_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> dealService.buyerAcceptPendingDeal(10L)).getErrorCode());
        }

        @Test
        @DisplayName("buyerAccept: luồng chính → COMPLETED")
        void acceptHappy() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Conversation conv = conversation(1L, l, buyer, seller);
            Deal d = dealEntity(1L, buyer, l, conv, STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);
            stubReviewLookupFalse(d);

            DealResponse res = dealService.buyerAcceptPendingDeal(10L);
            assertEquals(STATUS_COMPLETED, res.getStatus());
            assertNotNull(d.getConfirmedAt());
        }

        @Test
        @DisplayName("buyerReject: luồng chính → REJECTED")
        void rejectHappy() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Conversation conv = conversation(1L, l, buyer, seller);
            Deal d = dealEntity(1L, buyer, l, conv, STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    10L, 1L, STATUS_PENDING)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);
            stubReviewLookupFalse(d);

            DealResponse res = dealService.buyerRejectPendingDeal(10L);
            assertEquals(STATUS_REJECTED, res.getStatus());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Người bán từ chối lượt trả giá / xác nhận deal")
    class SellerDealActions {

        @Test
        @DisplayName("[Lỗi] rejectDeal: không phải seller → NOT_CHAT_PARTICIPANT")
        void rejectNotSeller() {
            User stranger = user(9L);
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT,
                    assertThrows(SlifeException.class, () -> dealService.rejectDeal(1L)).getErrorCode());
        }

        @Test
        @DisplayName("rejectDeal: luồng chính → CANCELLED")
        void rejectHappy() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);
            stubReviewLookupFalse(d);

            DealResponse res = dealService.rejectDeal(1L);
            assertEquals(STATUS_CANCELLED, res.getStatus());
        }

        @Test
        @DisplayName("[Lỗi] confirmDeal: không còn PENDING → INVALID_INPUT")
        void confirmWrongStatus() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.confirmDeal(1L)).getErrorCode());
        }

        @Test
        @DisplayName("confirmDeal: luồng chính → CONFIRMED")
        void confirmHappy() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(2L, 1L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);
            stubReviewLookupFalse(d);

            DealResponse res = dealService.confirmDeal(1L);
            assertEquals(STATUS_CONFIRMED, res.getStatus());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Cập nhật giờ nhận / gửi nhắc nhở")
    class PickupAndReminder {

        @Test
        @DisplayName("[Lỗi] updatePickupTime: người thứ ba → FORBIDDEN")
        void pickupStranger() {
            User stranger = user(99L);
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> dealService.updatePickupTime(1L, LocalDateTime.now()))
                            .getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] sendReminder: trạng thái không phải CONFIRMED → INVALID_INPUT")
        void reminderNotConfirmed() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.sendReminder(1L)).getErrorCode());
        }

        @Test
        @DisplayName("sendReminder: luồng chính → reminderSent = true")
        void reminderHappy() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_CONFIRMED);
            d.setPickupTime(LocalDateTime.now().plusDays(1));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);

            dealService.sendReminder(1L);

            assertTrue(d.getReminderSent());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Hủy deal (người mua — cancelDeal)")
    class CancelDeal {

        @Test
        @DisplayName("[Lỗi] Không phải buyer → NOT_CHAT_PARTICIPANT")
        void notBuyer() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            assertEquals(ErrorCode.NOT_CHAT_PARTICIPANT,
                    assertThrows(SlifeException.class, () -> dealService.cancelDeal(1L)).getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: CANCELLED + notify seller")
        void happy() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(dealRepository.save(d)).thenReturn(d);

            dealService.cancelDeal(1L);

            assertEquals(STATUS_CANCELLED, d.getStatus());
            assertNotNull(d.getDeletedAt());
            verify(notificationService).notifyDealFinalized(seller, buyer, 10L, l.getTitle(), false, false);
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Hoàn tất deal — người mua (finalizeByBuyer)")
    class FinalizeByBuyer {

        @Test
        @DisplayName("[Lỗi] Không phải buyer → FORBIDDEN")
        void notBuyer() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(true);
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> dealService.finalizeByBuyer(1L, req)).getErrorCode());
        }

        @Test
        @DisplayName("completed=true, có rating → SOLD + SUCCESS + review + notify rated")
        void completeWithRating() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(dealRepository.save(d)).thenReturn(d);
            when(listingRepository.save(l)).thenReturn(l);
            when(reviewRepository.findAverageRatingByReviewee_Id(2L)).thenReturn(4.5);
            stubReviewLookupFalse(d);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(true);
            req.setRating((byte) 5);
            req.setComment("ok");

            DealResponse res = dealService.finalizeByBuyer(1L, req);

            assertEquals(STATUS_SUCCESS, res.getStatus());
            assertEquals("SOLD", l.getStatus());
            verify(reviewRepository).save(any());
            verify(userRepository).saveAndFlush(seller);
            verify(notificationService).notifyDealFinalized(seller, buyer, 10L, l.getTitle(), true, true);
        }

        @Test
        @DisplayName("completed=false → CANCELLED + notify")
        void cancelPath() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(dealRepository.save(d)).thenReturn(d);
            stubReviewLookupFalse(d);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(false);

            DealResponse res = dealService.finalizeByBuyer(1L, req);
            assertEquals(STATUS_CANCELLED, res.getStatus());
            verify(notificationService).notifyDealFinalized(seller, buyer, 10L, l.getTitle(), false, false);
            verify(reviewRepository, never()).save(any());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Chi tiết deal / danh sách deal của tôi")
    class QueryDeals {

        @Test
        @DisplayName("[Lỗi] getDealById: không phải buyer/seller → FORBIDDEN")
        void getByIdStranger() {
            User stranger = user(99L);
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            assertEquals(ErrorCode.FORBIDDEN,
                    assertThrows(SlifeException.class, () -> dealService.getDealById(1L)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] getDealById: block → DEAL_NOT_FOUND")
        void getByIdBlocked() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            assertEquals(ErrorCode.DEAL_NOT_FOUND,
                    assertThrows(SlifeException.class, () -> dealService.getDealById(1L)).getErrorCode());
        }

        @Test
        @DisplayName("listMyDeals proposed: deal bị ẩn khi block với đối phương")
        void listProposedHidesBlocked() {
            User me = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, me, l, conversation(1L, l, me, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(me);
            when(dealRepository.findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(1L)).thenReturn(List.of(d));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);

            assertTrue(dealService.listMyDeals("proposed").isEmpty());
        }

        @Test
        @DisplayName("listMyDeals all: gộp proposed+received, sort theo createdAt desc")
        void listAllMerge() {
            User me = user(1L);
            User other = user(2L);
            Listing l1 = listing(10L, other, new BigDecimal("100"), false);
            Listing l2 = listing(20L, me, new BigDecimal("200"), false);
            Deal dProposed = dealEntity(1L, me, l1, conversation(1L, l1, me, other), STATUS_PENDING);
            dProposed.setCreatedAt(LocalDateTime.of(2024, 1, 1, 10, 0));
            Deal dReceived = dealEntity(2L, other, l2, conversation(2L, l2, other, me), STATUS_PENDING);
            dReceived.setCreatedAt(LocalDateTime.of(2024, 2, 1, 10, 0));
            when(userService.getCurrentUser()).thenReturn(me);
            when(dealRepository.findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(1L)).thenReturn(List.of(dProposed));
            when(dealRepository.findByListing_Seller_IdAndDeletedAtIsNullOrderByCreatedAtDesc(1L)).thenReturn(List.of(dReceived));
            when(blockService.isBlockedEitherDirection(anyLong(), anyLong())).thenReturn(false);
            stubReviewLookupFalse(null);

            List<DealResponse> out = dealService.listMyDeals("all");
            assertEquals(2, out.size());
            assertEquals(2L, out.get(0).getDealId());
            assertEquals(1L, out.get(1).getDealId());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Tự động hoàn tất deal / gửi đánh giá (submitReview)")
    class AutoAndReview {

        @Test
        @DisplayName("autoFinalizeDeals: deal COMPLETED quá hạn → SUCCESS + SOLD + notify")
        void autoFinalize() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_COMPLETED);
            d.setConfirmedAt(LocalDateTime.now().minusDays(10));
            when(dealRepository.findAllByStatusAndConfirmedAtBefore(eq(STATUS_COMPLETED), any(LocalDateTime.class)))
                    .thenReturn(List.of(d));
            when(listingRepository.save(l)).thenReturn(l);
            when(dealRepository.save(d)).thenReturn(d);

            dealService.autoFinalizeDeals();

            assertEquals(STATUS_SUCCESS, d.getStatus());
            assertEquals("SOLD", l.getStatus());
            verify(notificationService).notifyDealFinalized(eq(seller), eq(buyer), eq(10L), anyString(), eq(true), eq(false));
        }

        @Test
        @DisplayName("[Lỗi] submitReview: chưa SUCCESS → INVALID_INPUT")
        void submitNotSuccess() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 5);
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.submitReview(1L, req)).getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] submitReview: đã có review sau mốc deal → INVALID_INPUT")
        void submitDuplicate() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_SUCCESS);
            d.setConfirmedAt(LocalDateTime.now().minusDays(1));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(reviewRepository.existsReviewCreatedAfter(
                    eq(5L), eq(1L), any(Instant.class))).thenReturn(true);
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 4);
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> dealService.submitReview(1L, req)).getErrorCode());
        }

        @Test
        @DisplayName("submitReview: luồng chính → lưu review + notifyNewReview")
        void submitHappy() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = dealEntity(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_SUCCESS);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(reviewRepository.existsReviewCreatedAfter(
                    eq(5L), eq(1L), any(Instant.class))).thenReturn(false);
            when(reviewRepository.findAverageRatingByReviewee_Id(2L)).thenReturn(5.0);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 5);

            dealService.submitReview(1L, req);

            verify(reviewRepository).save(any());
            verify(userRepository).saveAndFlush(seller);
            verify(notificationService).notifyNewReview(eq(seller), eq(buyer), eq(10L), eq(l.getTitle()), eq(5), eq(5L));
        }
    }
}
