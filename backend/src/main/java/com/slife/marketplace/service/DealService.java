package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ConversationRepository;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DealService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    private final DealRepository dealRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;
    private final UserService userService;

    public DealService(DealRepository dealRepository,
                       ListingRepository listingRepository,
                       ConversationRepository conversationRepository,
                       UserService userService) {
        this.dealRepository = dealRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
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
        deal.setConversation(resolveConversationForDeal(listing, buyer));
        deal.setListing(listing);
        deal.setBuyer(buyer);
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

        // DB schema for deals does not have REJECTED; use CANCELLED for seller rejection.
        deal.setStatus(STATUS_CANCELLED);
        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    @Transactional
    public DealResponse confirmDeal(Long dealId) {
        User seller = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        if (deal.getSeller() == null || !deal.getSeller().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.NOT_CHAT_PARTICIPANT, "Chỉ người bán mới có quyền xác nhận giao dịch");
        }
        if (!STATUS_PENDING.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ giao dịch PENDING mới được xác nhận");
        }

        deal.setStatus(STATUS_CONFIRMED);
        deal.setConfirmedAt(LocalDateTime.now());
        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    @Transactional
    public DealResponse updatePickupTime(Long dealId, LocalDateTime pickupTime) {
        User current = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        boolean isBuyer = deal.getBuyer() != null && deal.getBuyer().getId().equals(current.getId());
        boolean isSeller = deal.getSeller() != null && deal.getSeller().getId().equals(current.getId());
        if (!isBuyer && !isSeller) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        deal.setPickupTime(pickupTime);
        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    @Transactional
    public void sendReminder(Long dealId) {
        User current = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        boolean isBuyer = deal.getBuyer() != null && deal.getBuyer().getId().equals(current.getId());
        boolean isSeller = deal.getSeller() != null && deal.getSeller().getId().equals(current.getId());
        if (!isBuyer && !isSeller) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        if (!STATUS_CONFIRMED.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ giao dịch CONFIRMED mới gửi được nhắc nhở");
        }
        deal.setReminderSent(true);
        dealRepository.save(deal);
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

    @Transactional(readOnly = true)
    public DealResponse getDealById(Long dealId) {
        User current = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        boolean isBuyer = deal.getBuyer() != null && deal.getBuyer().getId().equals(current.getId());
        boolean isSeller = deal.getSeller() != null && deal.getSeller().getId().equals(current.getId());
        if (!isBuyer && !isSeller) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        return mapToResponse(deal);
    }

    /**
     * Dự án không có role buyer/seller cố định.
     * - type=proposed: deals do current user đề xuất (proposed_by)
     * - type=received: deals thuộc listing của current user (listing.seller)
     * - type omitted: trả về tất cả deals liên quan tới current user (merge + sort desc by createdAt)
     */
    @Transactional(readOnly = true)
    public List<DealResponse> listMyDeals(String type) {
        User current = userService.getCurrentUser();
        String t = type != null ? type.trim().toLowerCase() : "";
        List<Deal> proposed = List.of();
        List<Deal> received = List.of();

        if (t.isEmpty() || "all".equals(t) || "proposed".equals(t)) {
            proposed = dealRepository.findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(current.getId());
        }
        if (t.isEmpty() || "all".equals(t) || "received".equals(t)) {
            received = dealRepository.findByListing_Seller_IdAndDeletedAtIsNullOrderByCreatedAtDesc(current.getId());
        }

        if (!t.isEmpty() && !"all".equals(t)) {
            List<Deal> only = "received".equals(t) ? received : proposed;
            return only.stream().map(this::mapToResponse).toList();
        }

        java.util.Map<Long, Deal> byId = new java.util.HashMap<>();
        for (Deal d : proposed) if (d != null && d.getId() != null) byId.put(d.getId(), d);
        for (Deal d : received) if (d != null && d.getId() != null) byId.put(d.getId(), d);

        return byId.values().stream()
                .sorted((a, b) -> {
                    var la = a.getCreatedAt();
                    var lb = b.getCreatedAt();
                    if (la == null && lb == null) return 0;
                    if (la == null) return 1;
                    if (lb == null) return -1;
                    return lb.compareTo(la);
                })
                .map(this::mapToResponse)
                .toList();
    }

    private DealResponse mapToResponse(Deal deal) {
        return DealResponse.builder()
                .dealId(deal.getId())
                .listingId(deal.getListing().getId())
                .buyerId(deal.getBuyer().getId())
                .sellerId(deal.getSeller().getId())
                .price(deal.getOfferedPrice())
                .status(deal.getStatus())
                .confirmedAt(deal.getConfirmedAt())
                .pickupTime(deal.getPickupTime())
                .reminderSent(deal.getReminderSent())
                .createdAt(deal.getCreatedAt())
                .build();
    }

    private Conversation resolveConversationForDeal(Listing listing, User buyer) {
        Long listingId = listing.getId();
        Long sellerId = listing.getSeller() != null ? listing.getSeller().getId() : null;
        if (listingId == null || sellerId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Listing data is incomplete for deal creation");
        }
        return conversationRepository.findActiveByListingAndParticipants(listingId, buyer.getId(), sellerId)
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
}

