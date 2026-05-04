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
import java.util.Optional;

import static com.slife.marketplace.service.DealService.STATUS_CONFIRMED;
import static com.slife.marketplace.service.DealService.STATUS_PENDING;
import static com.slife.marketplace.service.DealService.STATUS_SUCCESS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    private DealService service;

    @BeforeEach
    void setUp() {
        service = new DealService(
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
        u.setEmail("u" + id + "@ex.com");
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

    private static Deal deal(long id, User buyer, Listing listing, Conversation conv, String status) {
        Deal d = new Deal();
        d.setId(id);
        d.setBuyer(buyer);
        d.setListing(listing);
        d.setConversation(conv);
        d.setStatus(status);
        d.setOfferedPrice(new BigDecimal("100.00"));
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

    @Nested
    @DisplayName("Function: createDeal")
    class CreateDealGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - listing not found")
        void utcId01_shouldThrowListingNotFound_whenListingMissing() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.empty());
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.createDeal(10L, req));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - buyer deals own listing")
        void utcId02_shouldThrowInvalidInput_whenBuyerDealsOwnListing() {
            User u = user(2L);
            Listing l = listing(10L, u, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(u);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.createDeal(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - blocked with seller")
        void utcId03_shouldThrowFollowBlocked_whenBlocked() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(true);
            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("50"));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.createDeal(10L, req));
            assertEquals(ErrorCode.FOLLOW_BLOCKED, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - create pending deal successfully")
        void utcId04_shouldCreatePendingDeal_whenInputValid() {
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
                d.setId(300L);
                if (d.getCreatedAt() == null) d.setCreatedAt(LocalDateTime.now());
                if (d.getUpdatedAt() == null) d.setUpdatedAt(LocalDateTime.now());
                return d;
            });
            when(reviewRepository.existsReviewCreatedAfter(anyLong(), anyLong(), any())).thenReturn(false);

            DealRequest req = new DealRequest();
            req.setPrice(new BigDecimal("400"));
            DealResponse res = service.createDeal(10L, req);

            assertEquals(300L, res.getDealId());
            assertEquals(STATUS_PENDING, res.getStatus());
        }
    }

    @Nested
    @DisplayName("Function: sealDealBySeller")
    class SealDealBySellerGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - current user not seller")
        void utcId01_shouldThrowForbidden_whenNotSeller() {
            User stranger = user(9L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            when(userService.getCurrentUser()).thenReturn(stranger);
            when(listingRepository.findByIdAndDeletedAtIsNullForUpdate(10L)).thenReturn(Optional.of(l));
            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));

            SlifeException ex = assertThrows(SlifeException.class, () -> service.sealDealBySeller(10L, req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - no active chat session")
        void utcId02_shouldThrowChatSessionNotFound_whenNoConversation() {
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

            SlifeException ex = assertThrows(SlifeException.class, () -> service.sealDealBySeller(10L, req));
            assertEquals(ErrorCode.CHAT_SESSION_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - create pending deal from seller seal")
        void utcId03_shouldCreatePendingDeal_whenSealValid() {
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
                d.setId(400L);
                if (d.getCreatedAt() == null) d.setCreatedAt(LocalDateTime.now());
                if (d.getUpdatedAt() == null) d.setUpdatedAt(LocalDateTime.now());
                return d;
            });
            when(reviewRepository.existsReviewCreatedAfter(anyLong(), anyLong(), any())).thenReturn(false);

            SealDealRequest req = new SealDealRequest();
            req.setBuyerId(1L);
            req.setPrice(new BigDecimal("50"));
            req.setPickupTime(Instant.now().plus(1, ChronoUnit.DAYS));

            DealResponse res = service.sealDealBySeller(10L, req);
            assertEquals(400L, res.getDealId());
            assertEquals(STATUS_PENDING, res.getStatus());
        }
    }

    @Nested
    @DisplayName("Function: finalizeByBuyer")
    class FinalizeByBuyerGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - current user not buyer")
        void utcId01_shouldThrowForbidden_whenNotBuyer() {
            User seller = user(2L);
            User buyer = user(1L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(seller);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(true);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.finalizeByBuyer(1L, req));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Positive] - completed with rating")
        void utcId02_shouldMarkSuccessAndCreateReview_whenCompletedWithRating() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(dealRepository.save(d)).thenReturn(d);
            when(listingRepository.save(l)).thenReturn(l);
            when(reviewRepository.findAverageRatingByReviewee_Id(2L)).thenReturn(4.5);
            when(reviewRepository.existsReviewCreatedAfter(anyLong(), anyLong(), any())).thenReturn(false);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(true);
            req.setRating((byte) 5);
            req.setComment("ok");

            DealResponse res = service.finalizeByBuyer(1L, req);

            assertEquals(STATUS_SUCCESS, res.getStatus());
            assertEquals("SOLD", l.getStatus());
            verify(reviewRepository).save(any());
            verify(notificationService).notifyDealFinalized(seller, buyer, 10L, l.getTitle(), true, true);
        }

        @Test
        @DisplayName("UTCID03 [Positive] - completed false means cancel")
        void utcId03_shouldCancelDeal_whenCompletedFalse() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_CONFIRMED);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(dealRepository.save(d)).thenReturn(d);
            when(reviewRepository.existsReviewCreatedAfter(anyLong(), anyLong(), any())).thenReturn(false);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setCompleted(false);
            DealResponse res = service.finalizeByBuyer(1L, req);

            assertEquals(DealService.STATUS_CANCELLED, res.getStatus());
            verify(notificationService).notifyDealFinalized(seller, buyer, 10L, l.getTitle(), false, false);
            verify(reviewRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Function: submitReview")
    class SubmitReviewGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - deal not in success status")
        void utcId01_shouldThrowInvalidInput_whenDealNotSuccess() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(1L, l, buyer, seller), STATUS_PENDING);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 5);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.submitReview(1L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - duplicate review")
        void utcId02_shouldThrowInvalidInput_whenReviewAlreadyExists() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_SUCCESS);
            d.setConfirmedAt(LocalDateTime.now().minusDays(1));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(reviewRepository.existsReviewCreatedAfter(eq(5L), eq(1L), any())).thenReturn(true);
            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 4);

            SlifeException ex = assertThrows(SlifeException.class, () -> service.submitReview(1L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Positive] - submit review successfully")
        void utcId03_shouldSaveReviewAndNotify_whenValidInput() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing l = listing(10L, seller, new BigDecimal("100"), false);
            Deal d = deal(1L, buyer, l, conversation(5L, l, buyer, seller), STATUS_SUCCESS);
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(dealRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(d));
            when(reviewRepository.existsReviewCreatedAfter(eq(5L), eq(1L), any())).thenReturn(false);
            when(reviewRepository.findAverageRatingByReviewee_Id(2L)).thenReturn(5.0);

            FinalizeDealRequest req = new FinalizeDealRequest();
            req.setRating((byte) 5);
            req.setComment("tot");

            service.submitReview(1L, req);

            verify(reviewRepository).save(any());
            verify(userRepository).saveAndFlush(seller);
            verify(notificationService).notifyNewReview(eq(seller), eq(buyer), eq(10L), eq(l.getTitle()), eq(5), eq(5L));
        }
    }
}
