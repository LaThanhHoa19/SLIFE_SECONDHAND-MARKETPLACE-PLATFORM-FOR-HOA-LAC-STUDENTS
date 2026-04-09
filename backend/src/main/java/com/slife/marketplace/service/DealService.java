package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.request.FinalizeDealRequest;
import com.slife.marketplace.dto.request.SealDealRequest;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.entity.Address;
import com.slife.marketplace.entity.Conversation;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.entity.Review;
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
import com.slife.marketplace.util.TimeZones;
import org.springframework.scheduling.annotation.Scheduled;
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

    /** Mọi {@link LocalDateTime} nghiệp vụ deal (pickup, confirmed, …) lưu theo giờ Việt Nam. */
    public static final ZoneId ZONE_VIETNAM = TimeZones.VIETNAM;

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    /** Trạng thái đơn hàng đã được người mua xác nhận hoàn tất thành công. */
    public static final String STATUS_SUCCESS = "SUCCESS";
    /** Người mua từ chối sau khi người bán chốt đơn (deal đang PENDING). */
    public static final String STATUS_REJECTED = "REJECTED";

    private final DealRepository dealRepository;
    private final ListingImageRepository listingImageRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;
    private final OfferRepository offerRepository;
    private final AddressRepository addressRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final BlockService blockService;
    private final NotificationService notificationService;
    private final SystemEmailService systemEmailService;

    public DealService(DealRepository dealRepository,
                       ListingImageRepository listingImageRepository,
                       ListingRepository listingRepository,
                       ConversationRepository conversationRepository,
                       OfferRepository offerRepository,
                       AddressRepository addressRepository,
                       ReviewRepository reviewRepository,
                       UserRepository userRepository,
                       UserService userService,
                       NotificationService notificationService,
                       BlockService blockService,
                       SystemEmailService systemEmailService) {
        this.dealRepository = dealRepository;
        this.listingImageRepository = listingImageRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
        this.offerRepository = offerRepository;
        this.addressRepository = addressRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.blockService = blockService;
        this.systemEmailService = systemEmailService;
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
        if (blockService.isBlockedEitherDirection(buyer.getId(), listing.getSeller().getId())) {
            throw new SlifeException(ErrorCode.FOLLOW_BLOCKED, "Cannot interact due to a block");
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
        if (blockService.isBlockedEitherDirection(seller.getId(), buyer.getId())) {
            throw new SlifeException(ErrorCode.FOLLOW_BLOCKED, "Cannot interact due to a block");
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
                d.setPickupTime(LocalDateTime.ofInstant(request.getPickupTime(), ZONE_VIETNAM));
            }
            d.setOffer(offerForDeal);
            d.setAddress(resolveAddressForSeal(listing, request.getAddressId(), request.getPickupLocationText(), d.getAddress(), true));
            return mapToResponse(dealRepository.save(d));
        }

        Deal deal = new Deal();
        deal.setConversation(resolveConversationForDeal(listing, buyer));
        deal.setListing(listing);
        deal.setProposedBy(buyer);
        deal.setDealPrice(request.getPrice());
        deal.setStatus(STATUS_PENDING);
        deal.setOffer(offerForDeal);
        deal.setAddress(resolveAddressForSeal(listing, request.getAddressId(), request.getPickupLocationText(), null, false));
        if (request.getPickupTime() != null) {
            deal.setPickupTime(LocalDateTime.ofInstant(request.getPickupTime(), ZONE_VIETNAM));
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
        assertNoBlockBetweenDealParties(deal, buyer);
        deal.setStatus(STATUS_COMPLETED);
        deal.setConfirmedAt(LocalDateTime.now(ZONE_VIETNAM));
        Deal saved = dealRepository.save(deal);
        notifyDealStatusEmail(saved,
                "Bạn đã chấp nhận giao dịch.",
                "Người mua đã chấp nhận giao dịch.",
                buyer);
        return mapToResponse(saved);
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
        assertNoBlockBetweenDealParties(deal, buyer);
        deal.setStatus(STATUS_REJECTED);
        deal.setConfirmedAt(LocalDateTime.now(ZONE_VIETNAM));
        Deal saved = dealRepository.save(deal);
        notifyDealStatusEmail(saved,
                "Bạn đã từ chối giao dịch.",
                "Người mua đã từ chối giao dịch.",
                buyer);
        return mapToResponse(saved);
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
        assertNoBlockBetweenDealParties(deal, seller);

        // DB schema for deals does not have REJECTED; use CANCELLED for seller rejection.
        deal.setStatus(STATUS_CANCELLED);
        deal = dealRepository.save(deal);
        notifyDealStatusEmail(deal,
                "Người bán đã từ chối giao dịch này.",
                "Bạn đã từ chối giao dịch đang chờ xác nhận.",
                seller);
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
        assertNoBlockBetweenDealParties(deal, seller);

        deal.setStatus(STATUS_CONFIRMED);
        deal.setConfirmedAt(LocalDateTime.now(ZONE_VIETNAM));
        deal = dealRepository.save(deal);
        notifyDealStatusEmail(deal,
                "Người bán đã xác nhận giao dịch — kiểm tra lịch nhận hàng trên SLIFE.",
                "Bạn đã xác nhận giao dịch.",
                seller);
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
        assertNoBlockBetweenDealParties(deal, current);
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
        assertNoBlockBetweenDealParties(deal, current);
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
        assertNoBlockBetweenDealParties(deal, buyer);


        deal.setStatus(STATUS_CANCELLED);
        deal.setDeletedAt(LocalDateTime.now(ZONE_VIETNAM));

        // Gửi thông báo cho Seller biết bị hủy đơn
        notificationService.notifyDealFinalized(deal.getSeller(), buyer,
                deal.getListing() != null ? deal.getListing().getId() : null,
                deal.getListing() != null ? deal.getListing().getTitle() : "tin đăng của bạn", false, false);

        Deal saved = dealRepository.save(deal);
        notifyDealStatusEmail(saved,
                "Bạn đã hủy giao dịch.",
                "Người mua đã hủy giao dịch.",
                buyer);
    }

    @Transactional
    public DealResponse finalizeByBuyer(Long dealId, FinalizeDealRequest request) {
        User buyer = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        if (deal.getBuyer() == null || !deal.getBuyer().getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Chỉ người mua mới có quyền thực hiện hành động này");
        }

        // Không cho finalize deal đã ở trạng thái SUCCESS hoặc CANCELLED
        if (STATUS_SUCCESS.equals(deal.getStatus()) || STATUS_CANCELLED.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giao dịch này đã được xử lý rồi");
        }

        if (request.isCompleted()) {
            // Mark listing as SOLD
            Listing listing = deal.getListing();
            listing.setStatus("SOLD");
            listingRepository.save(listing);

            // Create Review only if rating is provided, or a default one
            if (request.getRating() != null) {
                Review review = new Review();
                review.setConversation(deal.getConversation());
                review.setReviewer(buyer);
                review.setReviewee(deal.getSeller());
                review.setRating(request.getRating());

                StringBuilder fullComment = new StringBuilder();
                if (request.getComment() != null && !request.getComment().trim().isEmpty()) {
                    fullComment.append(request.getComment().trim());
                }

                if (request.getTags() != null && !request.getTags().isEmpty()) {
                    String tagsStr = String.join(", ", request.getTags());
                    if (fullComment.length() > 0) {
                        fullComment.append("\n\nTiêu chí nổi bật: ").append(tagsStr);
                    } else {
                        fullComment.append("Tiêu chí nổi bật: ").append(tagsStr);
                    }
                }

                review.setComment(fullComment.toString());
                review.setCreatedAt(Instant.now());
                reviewRepository.save(review);
                reviewRepository.flush(); // Đẩy xuống DB ngay để tính trung bình chính xác
                refreshUserReputation(deal.getSeller());
            }

            deal.setStatus(STATUS_SUCCESS);

            // Notify seller
            notificationService.notifyDealFinalized(deal.getSeller(), buyer, listing.getId(), listing.getTitle(), true, request.getRating() != null);
        } else {
            // Cancel deal
            deal.setStatus(STATUS_CANCELLED);
            // Notify seller
            notificationService.notifyDealFinalized(deal.getSeller(), buyer, deal.getListing().getId(), deal.getListing().getTitle(), false, false);
        }

        deal.setUpdatedAt(LocalDateTime.now(ZONE_VIETNAM));
        Deal saved = dealRepository.save(deal);
        if (request.isCompleted()) {
            notifyDealStatusEmail(saved,
                    "Bạn đã xác nhận hoàn tất giao dịch.",
                    "Người mua đã xác nhận hoàn tất giao dịch.",
                    buyer);
        } else {
            notifyDealStatusEmail(saved,
                    "Bạn đã hủy giao dịch sau khi nhận hàng.",
                    "Người mua đã hủy giao dịch.",
                    buyer);
        }
        return mapToResponse(saved);
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
        assertNoBlockBetweenDealParties(deal, current);
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
            return only.stream()
                    .filter(d -> !isDealHiddenByBlock(d, current))
                    .map(this::mapToResponse)
                    .toList();
        }

        java.util.Map<Long, Deal> byId = new java.util.HashMap<>();
        for (Deal d : proposed) if (d != null && d.getId() != null) byId.put(d.getId(), d);
        for (Deal d : received) if (d != null && d.getId() != null) byId.put(d.getId(), d);

        return byId.values().stream()
                .filter(d -> !isDealHiddenByBlock(d, current))
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

    private void assertNoBlockBetweenDealParties(Deal deal, User current) {
        User buyer = deal.getBuyer();
        User seller = deal.getSeller();
        if (buyer == null || seller == null || buyer.getId() == null || seller.getId() == null) {
            return;
        }
        if (!current.getId().equals(buyer.getId()) && !current.getId().equals(seller.getId())) {
            return;
        }
        Long otherId = current.getId().equals(buyer.getId()) ? seller.getId() : buyer.getId();
        if (blockService.isBlockedEitherDirection(current.getId(), otherId)) {
            throw new SlifeException(ErrorCode.DEAL_NOT_FOUND);
        }
    }

    private boolean isDealHiddenByBlock(Deal d, User me) {
        User buyer = d.getBuyer();
        User seller = d.getSeller();
        if (buyer == null || seller == null || buyer.getId() == null || seller.getId() == null) {
            return false;
        }
        if (!me.getId().equals(buyer.getId()) && !me.getId().equals(seller.getId())) {
            return true;
        }
        Long otherId = me.getId().equals(buyer.getId()) ? seller.getId() : buyer.getId();
        return blockService.isBlockedEitherDirection(me.getId(), otherId);
    }

    private DealResponse mapToResponse(Deal deal) {
        if (deal == null) return null;

        Long offerId = deal.getOffer() != null ? deal.getOffer().getId() : null;
        Long addressId = deal.getAddress() != null ? deal.getAddress().getId() : null;

        Listing listing = deal.getListing();
        String title = (listing != null) ? listing.getTitle() : "Tin đăng";
        Long listingId = (listing != null) ? listing.getId() : null;
        String image = null;
        if (listingId != null) {
            image = listingImageRepository.findFirstByListing_IdOrderByDisplayOrderAsc(listingId)
                    .map(ListingImage::getImageUrl)
                    .orElse(null);
        }

        Long buyerId = (deal.getBuyer() != null) ? deal.getBuyer().getId() : null;

        User seller = deal.getSeller();
        Long sellerId = (seller != null) ? seller.getId() : null;
        String sName = (seller != null) ? seller.getFullName() : "Người bán";
        String sAvatar = (seller != null) ? seller.getAvatarUrl() : null;

        // Kiểm tra xem người mua đã đánh giá chưa (chỉ tính review được tạo SAU khi Deal được bắt đầu)
        boolean reviewed = false;
        if (deal.getConversation() != null && deal.getBuyer() != null) {
            // Lấy mốc thời gian chốt hoặc tạo làm chuẩn (tránh dùng review của deal trước đó)
            java.time.LocalDateTime startPoint = deal.getConfirmedAt() != null ? deal.getConfirmedAt() : deal.getCreatedAt();
            java.time.Instant after = startPoint.atZone(ZONE_VIETNAM).toInstant();

            reviewed = reviewRepository.existsReviewCreatedAfter(
                    deal.getConversation().getId(),
                    deal.getBuyer().getId(),
                    after
            );
        }

        return DealResponse.builder()
                .dealId(deal.getId())
                .offerId(offerId)
                .addressId(addressId)
                .listingId(listingId)
                .buyerId(buyerId)
                .sellerId(sellerId)
                .price(deal.getOfferedPrice())
                .status(deal.getStatus())
                .confirmedAt(deal.getConfirmedAt())
                .pickupTime(deal.getPickupTime())
                .reminderSent(deal.getReminderSent())
                .listingTitle(title)
                .listingImage(image)
                .sellerName(sName)
                .sellerAvatar(sAvatar)
                .isReviewed(reviewed)
                .createdAt(deal.getCreatedAt())
                .updatedAt(deal.getUpdatedAt())
                .build();
    }

    /**
     * Tự động hoàn thành các deal ở trạng thái COMPLETED (đã chốt trong chat)
     * mà người mua không bấm gì sau 7 ngày.
     */
    @Scheduled(cron = "0 0 1 * * ?") // Runs daily at 1:00 AM
    @Transactional
    public void autoFinalizeDeals() {
        // Auto-finalize deals that were confirmed (accepted) by buyer but not finalized after 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now(ZONE_VIETNAM).minusDays(7);
        // We use confirmedAt if available, otherwise createdAt
        List<Deal> pendingDeals = dealRepository.findAllByStatusAndConfirmedAtBefore(STATUS_COMPLETED, sevenDaysAgo);

        for (Deal deal : pendingDeals) {
            try {
                // Tương đương hành động Buyer bấm "Hoàn thành"
                Listing listing = deal.getListing();
                if (listing != null) {
                    listing.setStatus("SOLD");
                    listingRepository.save(listing);
                }

                deal.setStatus(STATUS_SUCCESS);
                deal.setUpdatedAt(LocalDateTime.now(ZONE_VIETNAM));
                dealRepository.save(deal);

                // Gửi thông báo cho Seller
                notificationService.notifyDealFinalized(deal.getSeller(), deal.getBuyer(),
                        listing != null ? listing.getId() : null,
                        listing != null ? listing.getTitle() : "tin đăng", true, false);

            } catch (Exception e) {
                // Log and continue
            }
        }
    }

    /**
     * Người mua gửi đánh giá cho deal đã hoàn thành (SUCCESS).
     * Tách riêng với finalizeByBuyer để tránh gọi lại API finalize lần 2.
     */
    @Transactional
    public void submitReview(Long dealId, FinalizeDealRequest request) {
        User buyer = userService.getCurrentUser();
        Deal deal = dealRepository.findByIdAndDeletedAtIsNull(dealId)
                .orElseThrow(() -> new SlifeException(ErrorCode.DEAL_NOT_FOUND));

        if (deal.getBuyer() == null || !deal.getBuyer().getId().equals(buyer.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Chỉ người mua mới có quyền đánh giá");
        }

        if (!STATUS_SUCCESS.equals(deal.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ có thể đánh giá giao dịch đã hoàn thành");
        }

        // Kiểm tra đã đánh giá chưa (chỉ tính review được tạo SAU khi Deal được bắt đầu để tránh conflict với deal cũ)
        if (deal.getConversation() != null && deal.getBuyer() != null) {
            java.time.LocalDateTime startPoint = deal.getConfirmedAt() != null ? deal.getConfirmedAt() : deal.getCreatedAt();
            java.time.Instant after = startPoint.atZone(ZONE_VIETNAM).toInstant();

            if (reviewRepository.existsReviewCreatedAfter(
                    deal.getConversation().getId(), buyer.getId(), after)) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Bạn đã đánh giá giao dịch này rồi");
            }
        }

        if (request.getRating() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Vui lòng chọn số sao đánh giá");
        }

        Review review = new Review();
        review.setConversation(deal.getConversation());
        review.setReviewer(buyer);
        review.setReviewee(deal.getSeller());
        review.setRating(request.getRating());

        StringBuilder fullComment = new StringBuilder();
        if (request.getComment() != null && !request.getComment().trim().isEmpty()) {
            fullComment.append(request.getComment().trim());
        }
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            String tagsStr = String.join(", ", request.getTags());
            if (fullComment.length() > 0) {
                fullComment.append("\n\nTiêu chí nổi bật: ").append(tagsStr);
            } else {
                fullComment.append("Tiêu chí nổi bật: ").append(tagsStr);
            }
        }
        review.setComment(fullComment.toString());
        review.setCreatedAt(Instant.now());
        reviewRepository.save(review);
        reviewRepository.flush(); // Đẩy xuống DB ngay để tính trung bình chính xác

        // Cập nhật điểm đánh giá cho người bán
        refreshUserReputation(deal.getSeller());

        // Gửi thông báo "Có đánh giá mới" cho Người bán
        Long convId = (deal.getConversation() != null) ? deal.getConversation().getId() : null;
        notificationService.notifyNewReview(deal.getSeller(), buyer,
                deal.getListing().getId(), deal.getListing().getTitle(), request.getRating(), convId);
    }

    private void refreshUserReputation(User user) {
        if (user == null || user.getId() == null) return;
        Double avg = reviewRepository.findAverageRatingByReviewee_Id(user.getId());
        if (avg != null) {
            user.setReputationScore(java.math.BigDecimal.valueOf(avg).setScale(2, java.math.RoundingMode.HALF_UP));
            userRepository.saveAndFlush(user);
        }
    }

    private void notifyDealStatusEmail(Deal deal, String buyerHeadline, String sellerHeadline, User actor) {
        if (deal == null) {
            return;
        }
        Listing listing = deal.getListing();
        Long listingId = listing != null ? listing.getId() : null;
        String listingTitle = listing != null ? listing.getTitle() : "tin đăng";

        User buyer = deal.getBuyer();
        User seller = deal.getSeller();
        if (buyer != null) {
            systemEmailService.sendDealStatusChangedEmail(buyer, deal, listingTitle, listingId, buyerHeadline, actor);
        }
        if (seller != null && (buyer == null || !seller.getId().equals(buyer.getId()))) {
            systemEmailService.sendDealStatusChangedEmail(seller, deal, listingTitle, listingId, sellerHeadline, actor);
        }
    }

    /**
     * Chốt đơn: gắn Offer nếu có offerId hợp lệ hoặc tự khớp lượt PENDING/ACCEPTED cùng giá.
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

    /**
     * Chốt đơn trong chat: nếu {@code pickupLocationText} khác chuỗi hiển thị của địa chỉ tin đăng,
     * tạo bản ghi {@link Address} mới cho người bán (không sửa địa chỉ gốc của tin).
     */
    private Address resolveAddressForSeal(Listing listing, Long explicitAddressId, String pickupLocationText,
                                          Address currentOnDeal, boolean updatingExisting) {
        String trimmed = pickupLocationText != null ? pickupLocationText.trim() : "";
        if (trimmed.isEmpty() || "—".equals(trimmed)) {
            if (updatingExisting) {
                return resolveAddressForSealUpdate(listing, explicitAddressId, currentOnDeal);
            }
            return resolveAddressForDeal(listing, explicitAddressId);
        }
        if (updatingExisting && currentOnDeal != null && trimmed.equals(formatAddressDisplay(currentOnDeal))) {
            return currentOnDeal;
        }
        Address listingPickup = listing.getPickupAddress();
        String baseDisplay = formatAddressDisplay(listingPickup);
        if (trimmed.equals(baseDisplay)) {
            if (updatingExisting) {
                return resolveAddressForSealUpdate(listing, explicitAddressId, currentOnDeal);
            }
            return resolveAddressForDeal(listing, explicitAddressId);
        }
        User seller = listing.getSeller();
        if (seller == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tin đăng thiếu người bán");
        }
        return persistSellerPickupAddressSnapshot(seller, listingPickup, trimmed);
    }

    private static String formatAddressDisplay(Address a) {
        if (a == null) {
            return "";
        }
        String loc = a.getLocationName();
        String txt = a.getAddressText();
        boolean hasLoc = loc != null && !loc.isBlank();
        boolean hasTxt = txt != null && !txt.isBlank();
        if (hasLoc && hasTxt) {
            return loc.trim() + ", " + txt.trim();
        }
        if (hasLoc) {
            return loc.trim();
        }
        if (hasTxt) {
            return txt.trim();
        }
        return "";
    }

    private Address persistSellerPickupAddressSnapshot(User seller, Address basePickup, String fullText) {
        Address a = new Address();
        a.setUser(seller);
        String t = fullText.trim();
        if (t.length() <= 200) {
            a.setLocationName(t);
            a.setAddressText(null);
        } else {
            a.setLocationName(t.substring(0, 200));
            a.setAddressText(t.substring(200));
        }
        if (basePickup != null) {
            a.setLat(basePickup.getLat());
            a.setLng(basePickup.getLng());
        }
        a.setIsDefault(false);
        Instant now = Instant.now();
        a.setCreatedAt(now);
        a.setUpdatedAt(now);
        return addressRepository.save(a);
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

