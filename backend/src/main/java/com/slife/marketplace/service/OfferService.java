package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.OfferRepository;
import com.slife.marketplace.repository.DealRepository;
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

    private final OfferRepository offerRepository;
    private final ConversationRepository conversationRepository;
    private final DealRepository dealRepository;
    private final UserService userService;

    public OfferService(OfferRepository offerRepository,
                        ConversationRepository conversationRepository,
                        DealRepository dealRepository,
                        UserService userService) {
        this.offerRepository = offerRepository;
        this.conversationRepository = conversationRepository;
        this.dealRepository = dealRepository;
        this.userService = userService;
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
        if (offer.getConversation() == null || !offer.getConversation().getSessionUuid().equals(sessionId)) {
            throw new SlifeException(ErrorCode.OFFER_NOT_FOUND);
        }
        if (!offer.getListing().getSeller().getId().equals(current.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        if (!STATUS_PENDING.equals(offer.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer is not pending");
        }
        offer.setStatus(STATUS_ACCEPTED);
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
}
