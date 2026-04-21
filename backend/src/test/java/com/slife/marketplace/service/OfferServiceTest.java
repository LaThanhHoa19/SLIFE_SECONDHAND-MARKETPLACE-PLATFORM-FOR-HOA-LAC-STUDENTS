package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateOfferRequest;
import com.slife.marketplace.dto.response.OfferResponse;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock
    private OfferRepository offerRepository;
    @Mock
    private ListingRepository listingRepository;
    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private DealRepository dealRepository;
    @Mock
    private DealService dealService;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private SystemEmailService systemEmailService;
    @Mock
    private BlockService blockService;

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
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@example.com");
        u.setFullName("User " + id);
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

    private static Conversation conversation(long id, Listing listing, User buyer, User seller) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setListing(listing);
        c.setUserId1(buyer);
        c.setUserId2(seller);
        c.setStatus(Conversation.STATUS_ACTIVE);
        return c;
    }

    @Nested
    @DisplayName("Function: createOfferForListing")
    class CreateOfferForListingGroup {

        @Test
        @DisplayName("UTCID01 [Positive] - create offer successfully")
        void utcId01_shouldCreatePendingOffer_whenBusinessRulesPass() {
            User buyer = user(1L);
            User seller = user(2L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);
            when(offerRepository.countByBuyer_IdAndListing_IdAndStatus(1L, 10L, OfferService.STATUS_PENDING)).thenReturn(0L);
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> {
                Offer o = inv.getArgument(0);
                o.setId(999L);
                return o;
            });

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));
            OfferResponse out = offerService.createOfferForListing(10L, req);

            assertNotNull(out);
            assertEquals(999L, out.getId());
            assertEquals(OfferService.STATUS_PENDING, out.getStatus());
            verify(notificationService).notifyOfferProposal(eq(seller), eq(buyer), eq(10L), eq("T10"), eq(new BigDecimal("900")));
        }

        @Test
        @DisplayName("UTCID02 [Negative] - listing not found")
        void utcId02_shouldThrowListingNotFound_whenListingMissing() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(listingRepository.findById(404L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(404L, new CreateOfferRequest()));
            assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - buyer is listing seller")
        void utcId03_shouldThrowInvalidInput_whenBuyerIsSeller() {
            User buyer = user(1L);
            Listing listing = listing(10L, buyer, "ACTIVE", new BigDecimal("1000"));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(new BigDecimal("900"));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Boundary] - proposed price is zero or negative")
        void utcId04_shouldThrowInvalidInput_whenProposedPriceNotPositive() {
            User buyer = user(1L);
            Listing listing = listing(10L, user(2L), "ACTIVE", new BigDecimal("1000"));
            when(userService.getCurrentUser()).thenReturn(buyer);
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(blockService.isBlockedEitherDirection(1L, 2L)).thenReturn(false);

            CreateOfferRequest req = new CreateOfferRequest();
            req.setProposedPrice(BigDecimal.ZERO);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> offerService.createOfferForListing(10L, req));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("Function: acceptOffer")
    class AcceptOfferGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - offer not found")
        void utcId01_shouldThrowOfferNotFound_whenOfferIdMissing() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(offerRepository.findById(9L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - current user is not seller")
        void utcId02_shouldThrowForbidden_whenCurrentUserNotSeller() {
            User current = user(1L);
            User seller = user(2L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, listing, user(3L), OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(userService.getCurrentUser()).thenReturn(current);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - offer is not pending")
        void utcId03_shouldThrowOfferNotPending_whenStatusNotPending() {
            User seller = user(2L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, listing, user(3L), OfferService.STATUS_REJECTED, new BigDecimal("900"));
            when(userService.getCurrentUser()).thenReturn(seller);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.acceptOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_PENDING, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - accept offer and reject others")
        void utcId04_shouldAcceptOfferCreateDealAndRejectOthers() {
            User seller = user(2L);
            User buyer = user(3L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer accepted = offer(9L, listing, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            Offer other1 = offer(10L, listing, user(4L), OfferService.STATUS_PENDING, new BigDecimal("850"));
            Offer other2 = offer(11L, listing, user(5L), OfferService.STATUS_PENDING, new BigDecimal("800"));

            when(userService.getCurrentUser()).thenReturn(seller);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(accepted));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(false);
            doNothing().when(dealService).lockAndPrepareExclusiveBuyerDealOnListing(10L, 3L);
            when(offerRepository.findByListing_IdAndStatusOrderByCreatedAtDesc(10L, OfferService.STATUS_PENDING))
                    .thenReturn(List.of(accepted, other1, other2));
            when(conversationRepository.findActiveByListingAndParticipants(10L, 3L, 2L))
                    .thenReturn(Optional.of(conversation(77L, listing, buyer, seller)));
            when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> inv.getArgument(0));

            OfferResponse out = offerService.acceptOffer(9L);

            assertNotNull(out);
            assertEquals(OfferService.STATUS_ACCEPTED, out.getStatus());
            verify(offerRepository).save(accepted);
            verify(offerRepository).saveAll(any());
            verify(notificationService).notifyDealConfirmed(eq(buyer), eq(seller), eq(10L), eq("T10"), eq(77L));
        }
    }

    @Nested
    @DisplayName("Function: rejectOffer")
    class RejectOfferGroup {

        @Test
        @DisplayName("UTCID01 [Negative] - offer not found")
        void utcId01_shouldThrowOfferNotFound_whenOfferIdMissing() {
            when(userService.getCurrentUser()).thenReturn(user(1L));
            when(offerRepository.findById(9L)).thenReturn(Optional.empty());

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID02 [Negative] - current user is not seller")
        void utcId02_shouldThrowForbidden_whenCurrentUserNotSeller() {
            User current = user(1L);
            User seller = user(2L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, listing, user(3L), OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(userService.getCurrentUser()).thenReturn(current);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID03 [Negative] - offer is not pending")
        void utcId03_shouldThrowOfferNotPending_whenStatusNotPending() {
            User seller = user(2L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, listing, user(3L), OfferService.STATUS_ACCEPTED, new BigDecimal("900"));
            when(userService.getCurrentUser()).thenReturn(seller);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));

            SlifeException ex = assertThrows(SlifeException.class, () -> offerService.rejectOffer(9L));
            assertEquals(ErrorCode.OFFER_NOT_PENDING, ex.getErrorCode());
        }

        @Test
        @DisplayName("UTCID04 [Positive] - reject offer successfully")
        void utcId04_shouldRejectAndNotify_whenBusinessRulesPass() {
            User seller = user(2L);
            User buyer = user(3L);
            Listing listing = listing(10L, seller, "ACTIVE", new BigDecimal("1000"));
            Offer o = offer(9L, listing, buyer, OfferService.STATUS_PENDING, new BigDecimal("900"));
            when(userService.getCurrentUser()).thenReturn(seller);
            when(offerRepository.findById(9L)).thenReturn(Optional.of(o));
            when(blockService.isBlockedEitherDirection(2L, 3L)).thenReturn(false);
            when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> inv.getArgument(0));

            OfferResponse out = offerService.rejectOffer(9L);

            assertNotNull(out);
            assertEquals(OfferService.STATUS_REJECTED, out.getStatus());
            verify(notificationService).notifyOfferRejected(eq(buyer), eq(seller), eq(10L), eq("T10"), eq(new BigDecimal("900")));
        }
    }
}
