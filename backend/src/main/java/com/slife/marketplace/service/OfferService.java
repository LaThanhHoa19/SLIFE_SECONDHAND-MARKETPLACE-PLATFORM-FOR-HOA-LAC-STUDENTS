package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateOfferRequest;
import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.response.OfferResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.OfferStatus;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.OfferRepository;
import com.slife.marketplace.repository.OfferStatusRepository;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class OfferService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_EXPIRED = "EXPIRED";

    private final OfferRepository offerRepository;
    private final OfferStatusRepository offerStatusRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;
    private final DealRepository dealRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public OfferService(OfferRepository offerRepository,
                        OfferStatusRepository offerStatusRepository,
                        ListingRepository listingRepository,
                        ConversationRepository conversationRepository,
                        DealRepository dealRepository,
                        UserService userService,
                        NotificationService notificationService) {
        this.offerRepository = offerRepository;
        this.offerStatusRepository = offerStatusRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
        this.dealRepository = dealRepository;
        this.userService = userService;
        this.notificationService = notificationService;
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

        BigDecimal proposed = request.getProposedPrice();
        if (proposed == null || proposed.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }
        BigDecimal listingPrice = listing.getPrice() != null ? listing.getPrice() : BigDecimal.ZERO;
        if (proposed.compareTo(listingPrice) >= 0) {
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }

        Offer offer = new Offer();
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setConversation(null);
        offer.setProposedPrice(proposed);
        offer.setMessage(request.getMessage() != null && !request.getMessage().isBlank() ? request.getMessage().trim() : null);
        offer.setOfferStatus(requireStatus(STATUS_PENDING));
        offer.setCreatedAt(Instant.now());
        offer.setUpdatedAt(Instant.now());
        Offer saved = offerRepository.save(offer);

        if (listing.getSeller() != null) {
            notificationService.notifyOfferProposal(listing.getSeller(), buyer, listing.getId(), proposed);
        }
        return toResponse(saved);
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
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }
        BigDecimal listingPrice = listing.getPrice() != null ? listing.getPrice() : BigDecimal.ZERO;
        if (proposed.compareTo(listingPrice) >= 0) {
            throw new SlifeException(ErrorCode.OFFER_PRICE_INVALID);
        }
        if (listing.getSeller().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Người bán không thể trả giá cho bài đăng của chính mình");
        }
        Offer offer = new Offer();
        offer.setConversation(conv);
        offer.setListing(listing);
        offer.setBuyer(current);
        offer.setProposedPrice(proposed);
        offer.setOfferStatus(requireStatus(STATUS_PENDING));
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
        if (offer.getConversation() == null || !offer.getConversation().getSessionUuid().equals(sessionId)) {
            throw new SlifeException(ErrorCode.OFFER_NOT_FOUND);
        }
        if (!offer.getListing().getSeller().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        if (!STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer is not pending");
        }
        offer.setOfferStatus(requireStatus(STATUS_ACCEPTED));
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);

        Deal deal = new Deal();
        deal.setListing(offer.getListing());
        deal.setBuyer(offer.getBuyer());
        deal.setSeller(offer.getListing().getSeller());
        deal.setOfferedPrice(offer.getAmount());
        deal.setStatus("PENDING");
        return dealRepository.save(deal);
    }

    private OfferStatus requireStatus(String code) {
        return offerStatusRepository.findByCode(code)
                .orElseThrow(() -> new SlifeException(ErrorCode.INTERNAL_ERROR, "Offer status not configured: " + code));
    }

    private OfferResponse toResponse(Offer offer) {
        OfferResponse response = new OfferResponse();
        response.setId(offer.getId());
        response.setListingId(offer.getListing() != null ? offer.getListing().getId() : null);
        response.setBuyerId(offer.getBuyer() != null ? offer.getBuyer().getId() : null);
        response.setProposedPrice(offer.getProposedPrice());
        response.setMessage(offer.getMessage());
        response.setStatus(offer.getStatus());
        response.setCreatedAt(offer.getCreatedAt());
        response.setUpdatedAt(offer.getUpdatedAt());
        return response;
    }
}
