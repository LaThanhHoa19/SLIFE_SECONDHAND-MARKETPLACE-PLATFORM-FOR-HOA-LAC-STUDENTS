package com.slife.marketplace.service;

import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.OfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Legacy offer service. New offer flow uses ChatService.makeOffer() instead.
 */
@Service
public class OfferService {

    public static final String STATUS_PENDING  = "PENDING";
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
     * Seller accepts offer: create Deal in PENDING status (UC-30).
     */
    @Transactional
    public Deal acceptOffer(Long offerId, String sessionId) {
        User current = userService.getCurrentUser();
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
        if (offer.getConversation() == null ||
                !offer.getConversation().getSessionUuid().equals(sessionId)) {
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
        deal.setOffer(offer);
        deal.setConversation(offer.getConversation());
        deal.setListing(offer.getListing());
        deal.setProposedBy(offer.getBuyer());
        deal.setDealPrice(offer.getAmount());
        deal.setStatus("PENDING");
        deal.setReminderSent(false);
        deal.setCreatedAt(Instant.now());
        deal.setUpdatedAt(Instant.now());
        return dealRepository.save(deal);
    }
}
