package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class DealService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    private final DealRepository dealRepository;
    private final ListingRepository listingRepository;
    private final UserService userService;

    public DealService(DealRepository dealRepository, ListingRepository listingRepository, UserService userService) {
        this.dealRepository = dealRepository;
        this.listingRepository = listingRepository;
        this.userService = userService;
    }

    @Transactional
    public DealResponse createDeal(Long listingId, DealRequest request) {
        User buyer = userService.getCurrentUser();
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        // Business Rules
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Không thể trả giá cho bài đăng của chính mình");
        }
        if (Boolean.TRUE.equals(listing.getIsGiveaway()) || (listing.getPrice() != null && listing.getPrice().compareTo(BigDecimal.ZERO) == 0)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Không thể trả giá cho đồ tặng miễn phí");
        }
        if (request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá phải >= 0");
        }

        Deal deal = new Deal();
        deal.setListing(listing);
        deal.setBuyer(buyer);
        deal.setSeller(listing.getSeller());
        deal.setOfferedPrice(request.getPrice());
        deal.setStatus(STATUS_PENDING);

        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    @Transactional
    public DealResponse rejectDeal(Long dealId) {
        User seller = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        if (!deal.getSeller().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT, "Chỉ người bán mới có quyền từ chối lượt trả giá này");
        }
        if (!STATUS_PENDING.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ có thể từ chối lượt trả giá đang chờ (PENDING)");
        }

        deal.setStatus(STATUS_REJECTED);
        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    @Transactional
    public void cancelDeal(Long dealId) {
        User buyer = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        if (!deal.getBuyer().getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT, "Chỉ người mua mới có quyền hủy lượt trả giá này");
        }

        deal.setStatus(STATUS_CANCELLED);
        deal.setDeletedAt(LocalDateTime.now());
        dealRepository.save(deal);
    }

    private DealResponse mapToResponse(Deal deal) {
        return DealResponse.builder()
                .dealId(deal.getId())
                .listingId(deal.getListing().getId())
                .buyerId(deal.getBuyer().getId())
                .sellerId(deal.getSeller().getId())
                .price(deal.getOfferedPrice())
                .status(deal.getStatus())
                .createdAt(deal.getCreatedAt())
                .build();
    }
}

