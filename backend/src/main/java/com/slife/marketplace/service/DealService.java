package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.request.SealDealRequest;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.entity.Address;
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
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.OfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.slife.marketplace.service.OfferService.STATUS_ACCEPTED;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class DealService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    /** Người mua từ chối sau khi người bán chốt đơn (deal đang PENDING). */
    public static final String STATUS_REJECTED = "REJECTED";

    private final DealRepository dealRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;
    private final OfferRepository offerRepository;
    private final AddressRepository addressRepository;
    private final UserService userService;

    public DealService(DealRepository dealRepository,
                       ListingRepository listingRepository,
                       ConversationRepository conversationRepository,
                       OfferRepository offerRepository,
                       AddressRepository addressRepository,
                       UserService userService) {
        this.dealRepository = dealRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
        this.offerRepository = offerRepository;
        this.addressRepository = addressRepository;
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
        Offer offerForDeal = resolveOfferForCreateDeal(listingId, buyer, request.getPrice(), request.getOfferId())
                .orElseGet(() -> persistNewPendingOffer(listing, buyer, request.getPrice()));
        deal.setOffer(offerForDeal);
        deal.setAddress(resolveAddressForDeal(listing, request.getAddressId()));

        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    /**
     * Người bán chốt đơn trong chat: lưu deal {@code PENDING} (người mua là {@code proposed_by}).
     * Nếu đã có deal PENDING cùng listing + buyer thì cập nhật giá / thời gian nhận.
     */
    @Transactional
    public DealResponse sealDealBySeller(Long listingId, SealDealRequest request) {
        User seller = userService.getCurrentUser();
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Chỉ người bán mới chốt đơn");
        }
        User buyer = userService.getUserById(request.getBuyerId());
        if (buyer.getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Người mua không hợp lệ");
        }
        conversationRepository.findActiveByListingBuyerSeller(listingId, buyer.getId(), seller.getId())
                .orElseThrow(() -> new SlifeException(ErrorCode.CHAT_SESSION_NOT_FOUND,
                        "Không có cuộc trò chuyện với người mua này"));

        if (request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá phải >= 0");
        }
        if (request.getPickupTime() != null && !request.getPickupTime().isAfter(Instant.now())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Thời gian nhận hàng phải sau thời điểm hiện tại");
        }

        Offer offerForDeal = resolveOfferForSeal(listingId, seller, buyer, request.getPrice(), request.getOfferId())
                .orElseGet(() -> persistNewPendingOffer(listing, buyer, request.getPrice()));

        Optional<Deal> existing = dealRepository
                .findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                        listingId, buyer.getId(), STATUS_PENDING);
        if (existing.isPresent()) {
            Deal d = existing.get();
            d.setDealPrice(request.getPrice());
            if (request.getPickupTime() != null) {
                d.setPickupTime(LocalDateTime.ofInstant(request.getPickupTime(), ZoneId.systemDefault()));
            }
            d.setOffer(offerForDeal);
            d.setAddress(resolveAddressForSealUpdate(listing, request.getAddressId(), d.getAddress()));
            return mapToResponse(dealRepository.save(d));
        }

        Deal deal = new Deal();
        deal.setConversation(resolveConversationForDeal(listing, buyer));
        deal.setListing(listing);
        deal.setProposedBy(buyer);
        deal.setDealPrice(request.getPrice());
        deal.setStatus(STATUS_PENDING);
        deal.setOffer(offerForDeal);
        deal.setAddress(resolveAddressForDeal(listing, request.getAddressId()));
        if (request.getPickupTime() != null) {
            deal.setPickupTime(LocalDateTime.ofInstant(request.getPickupTime(), ZoneId.systemDefault()));
        }
        deal = dealRepository.save(deal);
        return mapToResponse(deal);
    }

    /**
     * Người mua chấp nhận sau khi người bán chốt đơn: PENDING → COMPLETED.
     */
    @Transactional
    public DealResponse buyerAcceptPendingDeal(Long listingId) {
        User buyer = userService.getCurrentUser();
        Deal deal = dealRepository
                .findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                        listingId, buyer.getId(), STATUS_PENDING)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND,
                        "Không có giao dịch chờ xác nhận cho tin này"));
        if (!STATUS_PENDING.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giao dịch không còn ở trạng thái chờ");
        }
        deal.setStatus(STATUS_COMPLETED);
        deal.setConfirmedAt(LocalDateTime.now());
        return mapToResponse(dealRepository.save(deal));
    }

    /**
     * Người mua từ chối sau khi người bán chốt đơn: PENDING → REJECTED.
     */
    @Transactional
    public DealResponse buyerRejectPendingDeal(Long listingId) {
        User buyer = userService.getCurrentUser();
        Deal deal = dealRepository
                .findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                        listingId, buyer.getId(), STATUS_PENDING)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND,
                        "Không có giao dịch chờ để từ chối"));
        if (!STATUS_PENDING.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giao dịch không còn ở trạng thái chờ");
        }
        deal.setStatus(STATUS_REJECTED);
        deal.setConfirmedAt(LocalDateTime.now());
        return mapToResponse(dealRepository.save(deal));
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
        Long offerId = deal.getOffer() != null ? deal.getOffer().getId() : null;
        Long addressId = deal.getAddress() != null ? deal.getAddress().getId() : null;
        return DealResponse.builder()
                .dealId(deal.getId())
                .offerId(offerId)
                .addressId(addressId)
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

    /**
     * Chốt đơn: gắn {@link Deal#setOffer(Offer)} nếu có {@code offerId} hợp lệ hoặc tự khớp lượt PENDING/ACCEPTED cùng giá.
     */
    private Optional<Offer> resolveOfferForSeal(Long listingId, User seller, User buyer, BigDecimal price, Long explicitOfferId) {
        if (explicitOfferId != null) {
            Offer offer = offerRepository.findById(explicitOfferId)
                    .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
            assertOfferMatchesSeal(offer, listingId, seller, buyer, price);
            return Optional.of(offer);
        }
        return offerRepository.findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
                listingId, buyer.getId(), price, List.of(STATUS_PENDING, STATUS_ACCEPTED));
    }

    private void assertOfferMatchesSeal(Offer offer, Long listingId, User seller, User buyer, BigDecimal price) {
        if (offer.getListing() == null || !listingId.equals(offer.getListing().getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer không thuộc tin đăng này");
        }
        if (offer.getBuyer() == null || !buyer.getId().equals(offer.getBuyer().getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer không thuộc người mua này");
        }
        if (offer.getListing().getSeller() == null || !seller.getId().equals(offer.getListing().getSeller().getId())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer không thuộc người bán hiện tại");
        }
        if (offer.getAmount() == null || offer.getAmount().compareTo(price) != 0) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá chốt đơn phải khớp số tiền trong lượt trả giá");
        }
        String st = offer.getStatus();
        if (!STATUS_PENDING.equals(st) && !STATUS_ACCEPTED.equals(st)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Lượt trả giá không còn hợp lệ để chốt đơn");
        }
    }

    /**
     * Tạo deal từ listing: gắn offer PENDING nếu truyền {@code offerId} hoặc tự khớp cùng giá.
     */
    private Offer persistNewPendingOffer(Listing listing, User buyer, BigDecimal amount) {
        Offer offer = new Offer();
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setAmount(amount);
        offer.setStatus(STATUS_PENDING);
        Instant now = Instant.now();
        offer.setCreatedAt(now);
        offer.setUpdatedAt(now);
        return offerRepository.save(offer);
    }

    /**
     * Địa chỉ giao: {@code addressId} (thuộc người bán) hoặc địa chỉ nhận mặc định của tin.
     */
    private Address resolveAddressForDeal(Listing listing, Long explicitAddressId) {
        if (explicitAddressId != null) {
            Address addr = addressRepository.findById(explicitAddressId)
                    .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Địa chỉ không tồn tại"));
            Long sellerId = listing.getSeller() != null ? listing.getSeller().getId() : null;
            if (sellerId == null || addr.getUser() == null || !sellerId.equals(addr.getUser().getId())) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Địa chỉ phải thuộc người bán của tin đăng");
            }
            return addr;
        }
        return listing.getPickupAddress();
    }

    /** Khi chốt lại deal: giữ địa chỉ cũ nếu client không gửi {@code addressId}. */
    private Address resolveAddressForSealUpdate(Listing listing, Long explicitAddressId, Address currentOnDeal) {
        if (explicitAddressId != null) {
            return resolveAddressForDeal(listing, explicitAddressId);
        }
        if (currentOnDeal != null) {
            return currentOnDeal;
        }
        return listing.getPickupAddress();
    }

    private Optional<Offer> resolveOfferForCreateDeal(Long listingId, User buyer, BigDecimal price, Long explicitOfferId) {
        if (explicitOfferId != null) {
            Offer offer = offerRepository.findById(explicitOfferId)
                    .orElseThrow(() -> new SlifeException(ErrorCode.OFFER_NOT_FOUND));
            if (offer.getListing() == null || !listingId.equals(offer.getListing().getId())) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer không thuộc tin đăng này");
            }
            if (offer.getBuyer() == null || !buyer.getId().equals(offer.getBuyer().getId())) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Offer không thuộc người mua hiện tại");
            }
            if (!STATUS_PENDING.equals(offer.getStatus())) {
                throw new SlifeException(ErrorCode.OFFER_NOT_PENDING);
            }
            if (offer.getAmount() == null || offer.getAmount().compareTo(price) != 0) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá deal phải khớp lượt trả giá");
            }
            return Optional.of(offer);
        }
        return offerRepository.findFirstByListing_IdAndBuyer_IdAndAmountAndStatusInOrderByCreatedAtDesc(
                listingId, buyer.getId(), price, List.of(STATUS_PENDING));
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

