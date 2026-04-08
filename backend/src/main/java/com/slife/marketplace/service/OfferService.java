package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateOfferRequest;
import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.response.OfferResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.OfferRepository;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.util.Constants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class OfferService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_EXPIRED = "EXPIRED";

    private final OfferRepository offerRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;
    private final DealRepository dealRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SystemEmailService systemEmailService;
    private final BlockService blockService;

    public OfferService(OfferRepository offerRepository,
                        ListingRepository listingRepository,
                        ConversationRepository conversationRepository,
                        DealRepository dealRepository,
                        UserService userService,
                        NotificationService notificationService,
                        SystemEmailService systemEmailService,
                        BlockService blockService) {
        this.offerRepository = offerRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
        this.dealRepository = dealRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.systemEmailService = systemEmailService;
        this.blockService = blockService;
    }

    /**
     * Propose a price (UC-30): price must be positive and lower than listing price.
     */
    @Transactional
    public Offer makeOffer(MakeOfferRequest request) {
        throw new SlifeException(ErrorCode.INVALID_INPUT,
                "Use ChatService.makeOffer(sessionId, amount, buyer) for chat offer flow");
    }

    /**
     * SCRUM-72: Create offer directly from listing details page.
     */
    @Transactional
    public OfferResponse createOfferForListing(Long listingId, CreateOfferRequest request) {
        User buyer = userService.getCurrentUser();
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!"ACTIVE".equalsIgnoreCase(listing.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ có thể trả giá cho tin đang ACTIVE");
        }
        if (listing.getSeller() != null && listing.getSeller().getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Người bán không thể trả giá cho bài đăng của chính mình");
        }
        if (listing.getSeller() != null && listing.getSeller().getId() != null
                && blockService.isBlockedEitherDirection(buyer.getId(), listing.getSeller().getId())) {
            throw new SlifeException(ErrorCode.FOLLOW_BLOCKED, "Cannot interact due to a block");
        }

        BigDecimal proposed = request.getProposedPrice();
        if (proposed == null || proposed.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Proposed price must be positive");
        }
        BigDecimal listingPrice = listing.getPrice() != null ? listing.getPrice() : BigDecimal.ZERO;
        if (proposed.compareTo(listingPrice) >= 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer price must be lower than original price");
        }

        long pendingOffers = offerRepository.countByBuyer_IdAndListing_IdAndStatus(
                buyer.getId(), listingId, STATUS_PENDING);
        if (pendingOffers > 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT,
                    "Bạn đã có một lượt trả giá đang chờ người bán phản hồi. Vui lòng đợi được chấp nhận hoặc từ chối rồi mới gửi lượt mới.");
        }

        Offer offer = new Offer();
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setConversation(null);
        offer.setAmount(proposed);
        offer.setStatus(STATUS_PENDING);
        offer.setCreatedAt(Instant.now());
        offer.setUpdatedAt(Instant.now());
        Offer saved = offerRepository.save(offer);

        if (listing.getSeller() != null) {
            notificationService.notifyOfferProposal(listing.getSeller(), buyer, listing.getId(),
                    listing.getTitle(), proposed);
            systemEmailService.sendOfferProposalEmail(
                    listing.getSeller(), emailDisplayName(buyer), listing.getTitle(), listing.getId(), proposed);
        }
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<OfferResponse> getOfferHistory(Long listingId, Long buyerId, String sessionId, int page, int size) {
        User currentUser = userService.getCurrentUser();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(20, Math.max(10, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Offer> offerPage;
        if (sessionId != null && !sessionId.isBlank()) {
            // DB-first fallback: if listingId is already provided, avoid touching chat schema.
            if (listingId != null) {
                offerPage = queryOfferHistoryByListing(listingId, buyerId, currentUser, pageable);
                var content = offerPage.getContent().stream().map(this::toResponse).toList();
                return new PagedResponse<>(
                        content,
                        offerPage.getNumber(),
                        offerPage.getSize(),
                        offerPage.getTotalElements(),
                        offerPage.getTotalPages()
                );
            }
            try {
                Conversation conversation = conversationRepository.findBySessionUuid(sessionId)
                        .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
                boolean isParticipant = conversation.getUserId1().getId().equals(currentUser.getId())
                        || conversation.getUserId2().getId().equals(currentUser.getId());
                boolean isListingSeller = conversation.getListing() != null
                        && conversation.getListing().getSeller() != null
                        && conversation.getListing().getSeller().getId().equals(currentUser.getId());
                if (!isParticipant && !isListingSeller) {
                    throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
                }
                Long listingIdFromSession = conversation.getListing() != null ? conversation.getListing().getId() : null;
                if (listingIdFromSession == null) {
                    throw new SlifeException(ErrorCode.INVALID_INPUT, "Session has no listing");
                }
                Long sessionBuyerId = resolveBuyerIdFromConversation(conversation);
                if (buyerId != null && !buyerId.equals(sessionBuyerId)) {
                    throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
                }
                offerPage = offerRepository.findByListing_IdAndBuyer_IdOrderByCreatedAtDesc(
                        listingIdFromSession, sessionBuyerId, pageable
                );
            } catch (SlifeException ex) {
                // Preserve explicit domain errors.
                if (ex.getErrorCode() == ErrorCode.NOT_CHAT_PARTICIPANT || ex.getErrorCode() == ErrorCode.FORBIDDEN) {
                    throw ex;
                }
                throw new SlifeException(ErrorCode.INVALID_INPUT,
                        "sessionId mode is unavailable in current DB schema. Please query by listingId.");
            } catch (Exception ex) {
                throw new SlifeException(ErrorCode.INVALID_INPUT,
                        "sessionId mode is unavailable in current DB schema. Please query by listingId.");
            }
        } else {
            offerPage = queryOfferHistoryByListing(listingId, buyerId, currentUser, pageable);
        }

        var content = offerPage.getContent().stream().map(this::toResponse).toList();
        return new PagedResponse<>(
                content,
                offerPage.getNumber(),
                offerPage.getSize(),
                offerPage.getTotalElements(),
                offerPage.getTotalPages()
        );
    }

    private Page<Offer> queryOfferHistoryByListing(Long listingId, Long buyerId, User currentUser, Pageable pageable) {
        if (listingId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "listingId or sessionId is required");
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        boolean isSeller = listing.getSeller() != null && listing.getSeller().getId().equals(currentUser.getId());
        if (listing.getSeller() != null && listing.getSeller().getId() != null && !isSeller
                && blockService.isBlockedEitherDirection(currentUser.getId(), listing.getSeller().getId())) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }

        Long effectiveBuyerId = buyerId;
        if (!isSeller) {
            if (effectiveBuyerId == null) {
                effectiveBuyerId = currentUser.getId();
            } else if (!effectiveBuyerId.equals(currentUser.getId())) {
                throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
            }
        }
        return effectiveBuyerId != null
                ? offerRepository.findByListing_IdAndBuyer_IdOrderByCreatedAtDesc(listingId, effectiveBuyerId, pageable)
                : offerRepository.findByListing_IdOrderByCreatedAtDesc(listingId, pageable);
    }

    private Long resolveBuyerIdFromConversation(Conversation conversation) {
        if (conversation.getListing() == null || conversation.getListing().getSeller() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Session has no seller/listing");
        }
        Long sellerId = conversation.getListing().getSeller().getId();
        if (!conversation.getUserId1().getId().equals(sellerId)) {
            return conversation.getUserId1().getId();
        }
        return conversation.getUserId2().getId();
    }

    /**
     * Backward-compatible helper for older callers that still use OfferService directly.
     */
    @Transactional
    public Offer makeOffer(String sessionId, BigDecimal amount) {
        User current = userService.getCurrentUser();
        Conversation conv = conversationRepository.findBySessionUuid(sessionId)
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        if (!conv.getUserId1().getId().equals(current.getId()) && !conv.getUserId2().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        Listing listing = conv.getListing();
        if (listing == null) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }
        BigDecimal proposed = amount;
        if (proposed == null || proposed.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Proposed price must be positive");
        }
        BigDecimal listingPrice = listing.getPrice() != null ? listing.getPrice() : BigDecimal.ZERO;
        if (proposed.compareTo(listingPrice) >= 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer price must be lower than original price");
        }
        if (listing.getSeller().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Người bán không thể trả giá cho bài đăng của chính mình");
        }
        if (blockService.isBlockedEitherDirection(current.getId(), listing.getSeller().getId())) {
            throw new SlifeException(ErrorCode.FOLLOW_BLOCKED, "Cannot interact due to a block");
        }
        long pendingOffers = offerRepository.countByBuyer_IdAndListing_IdAndStatus(
                current.getId(), listing.getId(), STATUS_PENDING);
        if (pendingOffers > 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT,
                    "Bạn đã có một lượt trả giá đang chờ người bán phản hồi. Vui lòng đợi được chấp nhận hoặc từ chối rồi mới gửi lượt mới.");
        }
        Offer offer = new Offer();
        offer.setConversation(conv);
        offer.setListing(listing);
        offer.setBuyer(current);
        offer.setAmount(proposed);
        offer.setStatus(STATUS_PENDING);
        offer.setCreatedAt(Instant.now());
        offer.setUpdatedAt(Instant.now());
        return offerRepository.save(offer);
    }

    /**
     * Seller accepts offer: create Deal in PENDING status (UC-30).
     */
    @Transactional
    public Deal acceptOffer(Long offerId, String sessionId) {
        User current = userService.getCurrentUser();
        Offer offer = offerRepository.findById(offerId).orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        if (!offer.getListing().getSeller().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        if (!STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer is not pending");
        }
        User buyerUser = offer.getBuyer();
        if (buyerUser != null && buyerUser.getId() != null
                && blockService.isBlockedEitherDirection(current.getId(), buyerUser.getId())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_FOUND);
        }
        offer.setStatus(STATUS_ACCEPTED);
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        Deal deal = new Deal();
        deal.setConversation(resolveConversationForOffer(offer));
        deal.setListing(offer.getListing());
        deal.setBuyer(offer.getBuyer());
        deal.setOffer(offer);
        deal.setOfferedPrice(offer.getAmount());
        deal.setStatus("PENDING");
        Deal savedDeal = dealRepository.save(deal);
        Listing listing = offer.getListing();
        Long convId = savedDeal.getConversation() != null ? savedDeal.getConversation().getId() : null;
        if (listing != null && buyerUser != null && listing.getSeller() != null) {
            notificationService.notifyDealConfirmed(
                    buyerUser, listing.getSeller(), listing.getId(), listing.getTitle(), convId);
            systemEmailService.sendOfferAcceptedEmails(
                    buyerUser, listing.getSeller(), listing.getTitle(), listing.getId(), convId, savedDeal.getId());
        }
        return savedDeal;
    }

    @Transactional(readOnly = true)
    public PagedResponse<OfferResponse> getOffersForListing(Long listingId, int page, int size) {
        User currentUser = userService.getCurrentUser();
        if (listingId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "listingId is required");
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        assertSellerCanReview(currentUser, listing);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(50, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Offer> offerPage = offerRepository.findByListing_IdOrderByCreatedAtDesc(listingId, pageable);
        List<OfferResponse> content = offerPage.getContent().stream()
                .filter(o -> o.getBuyer() == null || o.getBuyer().getId() == null
                        || !blockService.isBlockedEitherDirection(currentUser.getId(), o.getBuyer().getId()))
                .map(this::toResponse)
                .toList();
        return new PagedResponse<>(
                content,
                offerPage.getNumber(),
                offerPage.getSize(),
                offerPage.getTotalElements(),
                offerPage.getTotalPages()
        );
    }

    @Transactional
    public OfferResponse acceptOffer(Long offerId) {
        User currentUser = userService.getCurrentUser();
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        Listing listing = offer.getListing();
        if (listing == null) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }
        assertSellerCanReview(currentUser, listing);

        if (!STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);
        }
        User offerBuyer = offer.getBuyer();
        if (offerBuyer != null && offerBuyer.getId() != null
                && blockService.isBlockedEitherDirection(currentUser.getId(), offerBuyer.getId())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_FOUND);
        }

        Instant now = Instant.now();
        offer.setStatus(STATUS_ACCEPTED);
        offer.setUpdatedAt(now);
        offerRepository.save(offer);

        // Reject all remaining pending offers of this listing when one offer is accepted.
        List<Offer> pendingOffers = offerRepository.findByListing_IdAndStatusOrderByCreatedAtDesc(listing.getId(), STATUS_PENDING);
        for (Offer other : pendingOffers) {
            if (!other.getId().equals(offer.getId())) {
                other.setStatus(STATUS_REJECTED);
                other.setUpdatedAt(now);
            }
        }
        if (!pendingOffers.isEmpty()) {
            offerRepository.saveAll(pendingOffers);
        }

        // Listing stays ACTIVE until seller marks SOLD (PATCH /api/listings/{id}/sold).

        Deal deal = new Deal();
        deal.setConversation(resolveConversationForOffer(offer));
        deal.setListing(listing);
        deal.setBuyer(offer.getBuyer());
        deal.setOffer(offer);
        deal.setOfferedPrice(offer.getAmount());
        deal.setStatus("PENDING");
        dealRepository.save(deal);

        Long convId = deal.getConversation() != null ? deal.getConversation().getId() : null;
        notificationService.notifyDealConfirmed(
                offer.getBuyer(),
                listing.getSeller(),
                listing.getId(),
                listing.getTitle(),
                convId
        );
        systemEmailService.sendOfferAcceptedEmails(
                offer.getBuyer(),
                listing.getSeller(),
                listing.getTitle(),
                listing.getId(),
                convId,
                deal.getId()
        );
        return toResponse(offer);
    }

    @Transactional
    public OfferResponse rejectOffer(Long offerId) {
        User currentUser = userService.getCurrentUser();
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        Listing listing = offer.getListing();
        if (listing == null) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }
        assertSellerCanReview(currentUser, listing);

        if (!STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);
        }
        User offerBuyerReject = offer.getBuyer();
        if (offerBuyerReject != null && offerBuyerReject.getId() != null
                && blockService.isBlockedEitherDirection(currentUser.getId(), offerBuyerReject.getId())) {
            throw new SlifeException(ErrorCode.OFFER_NOT_FOUND);
        }

        offer.setStatus(STATUS_REJECTED);
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        User buyer = offer.getBuyer();
        if (buyer != null && listing.getSeller() != null && offer.getAmount() != null) {
            notificationService.notifyOfferRejected(buyer, listing.getSeller(), listing.getId(),
                    listing.getTitle(), offer.getAmount());
            systemEmailService.sendOfferRejectedEmails(
                    buyer,
                    listing.getSeller(),
                    listing.getTitle(),
                    listing.getId(),
                    offer.getAmount());
        }
        return toResponse(offer);
    }

    private static String emailDisplayName(User u) {
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

    private void assertSellerCanReview(User currentUser, Listing listing) {
        if (listing.getSeller() == null || listing.getSeller().getId() == null) {
            throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
        }
        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, Constants.MSG23);
        }
    }

    private Conversation resolveConversationForOffer(Offer offer) {
        Listing listing = offer.getListing();
        User buyer = offer.getBuyer();
        if (listing == null || listing.getSeller() == null || listing.getId() == null || buyer == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer is missing listing/buyer context");
        }
        return conversationRepository.findActiveByListingAndParticipants(
                        listing.getId(), buyer.getId(), listing.getSeller().getId())
                .orElseGet(() -> {
                    Conversation conv = new Conversation();
                    conv.setUserId1(buyer);
                    conv.setUserId2(listing.getSeller());
                    conv.setListing(listing);
                    conv.setStatus(Conversation.STATUS_ACTIVE);
                    conv.setCreatedAt(Instant.now());
                    conv.ensureSessionUuid();
                    return conversationRepository.save(conv);
                });
    }

    private OfferResponse toResponse(Offer offer) {
        OfferResponse response = new OfferResponse();
        response.setId(offer.getId());
        response.setListingId(offer.getListing() != null ? offer.getListing().getId() : null);
        response.setBuyerId(offer.getBuyer() != null ? offer.getBuyer().getId() : null);
        response.setProposedPrice(offer.getAmount());
        response.setMessage(offer.getMessage());
        response.setStatus(offer.getStatus());
        response.setCreatedAt(offer.getCreatedAt());
        response.setUpdatedAt(offer.getUpdatedAt());
        return response;
    }
}
