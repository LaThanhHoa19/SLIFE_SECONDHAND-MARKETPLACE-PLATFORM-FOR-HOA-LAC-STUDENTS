package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.ConfirmDealRequest;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DealService {

    private static final Logger log = LoggerFactory.getLogger(DealService.class);
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_COMPLETED = "COMPLETED";

    private final DealRepository dealRepository;
    private final UserService userService;

    public DealService(DealRepository dealRepository, UserService userService) {
        this.dealRepository = dealRepository;
        this.userService = userService;
    }

    /**
     * Finalize transaction: set deal status to CONFIRMED.
     */
    @Transactional
    public Deal confirm(ConfirmDealRequest request) {
        User current = userService.getCurrentUser();
        Deal deal = dealRepository.findById(request.getDealId()).orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));
        Long sellerId = deal.getListing() != null ? deal.getListing().getSeller().getId() : null;
        Long buyerId = deal.getProposedBy() != null ? deal.getProposedBy().getId() : null;
        if (sellerId == null || (!current.getId().equals(sellerId) && !current.getId().equals(buyerId))) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT);
        }
        if (!STATUS_PENDING.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Deal is not pending");
        }
        deal.setStatus(STATUS_CONFIRMED);
        deal.setUpdatedAt(Instant.now());
        return dealRepository.save(deal);
    }

    /**
     * UC-56: Auto-confirm — switch to COMPLETED after 3 days if no dispute.
     */
    @Scheduled(cron = "${app.deal.auto-complete-cron:0 0 2 * * ?}") // default: 2 AM daily
    @Transactional
    public void autoCompleteDeals() {
        List<Deal> all = dealRepository.findAll();
        Instant cutoff = Instant.now().minus(Constants.DEAL_AUTO_COMPLETE_DAYS, ChronoUnit.DAYS);
        for (Deal d : all) {
            if (STATUS_CONFIRMED.equals(d.getStatus()) && d.getCreatedAt() != null && d.getCreatedAt().isBefore(cutoff)) {
                d.setStatus(STATUS_COMPLETED);
                d.setUpdatedAt(Instant.now());
                dealRepository.save(d);
                log.info("Deal {} auto-completed", d.getId());
            }
        }
    }
}
