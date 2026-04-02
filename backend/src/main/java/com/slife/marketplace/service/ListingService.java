package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingImageItemResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Address;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.AddressRepository;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingLikeRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import com.slife.marketplace.util.AddressFormat;
import com.slife.marketplace.util.Constants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ListingService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "price", "title");
    /** Đồng bộ với frontend (tối đa 10 ảnh/tin). */
    private static final int DEFAULT_MAX_IMAGES_PER_POST = 10;
    /** Hạn hiển thị mặc định cho tin ACTIVE nếu chưa có config LISTING_EXPIRATION. */
    private static final int DEFAULT_LISTING_EXPIRATION_DAYS = 30;

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final SavedListingRepository savedListingRepository;
    private final CategoryRepository categoryRepository;
    private final AddressRepository addressRepository;
    private final FollowService followService;
    private final BlockService blockService;
    private final ListingLikeRepository listingLikeRepository;
    private final ListingImageService listingImageService;
    private final ConfigService configService;

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository,
                          SavedListingRepository savedListingRepository,
                          CategoryRepository categoryRepository,
                          AddressRepository addressRepository,
                          FollowService followService,
                          BlockService blockService,
                          ListingLikeRepository listingLikeRepository,
                          ListingImageService listingImageService,
                          ConfigService configService) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.savedListingRepository = savedListingRepository;
        this.categoryRepository = categoryRepository;
        this.addressRepository = addressRepository;
        this.followService = followService;
        this.blockService = blockService;
        this.listingLikeRepository = listingLikeRepository;
        this.listingImageService = listingImageService;
        this.configService = configService;
    }

    // ----------------------------------------------------------------
    // Public listing search
    // ----------------------------------------------------------------

    public PagedResponse<ListingResponse> getFilteredListings(
            Long categoryId,
            String location,
            String q,
            String sort,
            int page,
            int size,
            User currentUser) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                size > 0 ? Math.min(size, 20) : 10,
                parseSort(sort)
        );

        Page<Listing> pageResult = listingRepository.findByFilters(
                normalizeParam(q),
                categoryId,
                normalizeParam(location),
                null,   // purpose
                null,   // itemCond
                null,   // priceMin
                null,   // priceMax
                pageable
        );

        Set<Long> savedIds = currentUser != null
                ? new HashSet<>(savedListingRepository.findListingIdsByUserId(currentUser.getId()))
                : Set.of();

        List<Listing> listings = pageResult.getContent().stream()
                .filter(l -> !isSellerBlockingViewer(l.getSeller(), currentUser))
                .toList();
        Set<Long> followedSellerIds = resolveFollowedSellerIds(currentUser, listings);

        List<ListingResponse> content = listings.stream()
                .map(listing -> toListingResponse(
                        listing,
                        currentUser,
                        listing.getId() != null && savedIds.contains(listing.getId()),
                        isFollowedForListing(listing, currentUser, followedSellerIds)))
                .toList();

        enrichListingResponsesWithLikes(content, currentUser);

        return new PagedResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    /**
     * Optimized method for Listing Cards (UC-ListingCard-Performance)
     */
    public PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> getActiveListingCards(
            int page,
            int size,
            User currentUser,
            Long sellerId) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                size > 0 ? Math.min(size, 20) : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<com.slife.marketplace.dto.response.ListingCardResponse> pageResult =
                listingRepository.findAllActiveListingCards(sellerId, pageable);

        List<com.slife.marketplace.dto.response.ListingCardResponse> content =
                pageResult.getContent().stream()
                        .filter(card -> currentUser == null
                                || card.getSellerId() == null
                                || !blockService.isBlockedByCurrentUser(card.getSellerId(), currentUser.getId()))
                        .collect(Collectors.toCollection(java.util.ArrayList::new));
        if (currentUser != null && !content.isEmpty()) {
            Set<Long> sellerIds = content.stream()
                    .map(com.slife.marketplace.dto.response.ListingCardResponse::getSellerId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> listingIds = content.stream()
                    .map(com.slife.marketplace.dto.response.ListingCardResponse::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> followed = sellerIds.isEmpty()
                    ? Set.of()
                    : new HashSet<>(followService.findFollowedIdsAmong(currentUser.getId(), sellerIds));
            Set<Long> saved = listingIds.isEmpty()
                    ? Set.of()
                    : new HashSet<>(savedListingRepository.findSavedListingIdsAmong(currentUser.getId(), listingIds));
            for (com.slife.marketplace.dto.response.ListingCardResponse card : content) {
                Long sid = card.getSellerId();
                Long lid = card.getId();
                boolean f = sid != null
                        && !sid.equals(currentUser.getId())
                        && followed.contains(sid);
                card.setIsFollowed(f);
                card.setIsSaved(lid != null && saved.contains(lid));
            }
        } else {
            for (com.slife.marketplace.dto.response.ListingCardResponse card : content) {
                card.setIsFollowed(false);
                card.setIsSaved(false);
            }
        }

        enrichListingCardsWithLikes(content, currentUser);

        // Batch-load all images in one query and attach to each card
        if (!content.isEmpty()) {
            Set<Long> listingIds = content.stream()
                    .map(com.slife.marketplace.dto.response.ListingCardResponse::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<Long, List<String>> imagesByListing = listingImageRepository
                    .findByListingIdIn(listingIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            img -> img.getListing().getId(),
                            Collectors.mapping(
                                    com.slife.marketplace.entity.ListingImage::getImageUrl,
                                    Collectors.toList()
                            )
                    ));
            for (com.slife.marketplace.dto.response.ListingCardResponse card : content) {
                if (card.getId() != null) {
                    card.setImageUrls(imagesByListing.getOrDefault(card.getId(), java.util.Collections.emptyList()));
                }
            }
        }

        return new PagedResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    /**
     * Gắn likeCount / isLiked cho kết quả đã map (ví dụ {@code SearchController}).
     */
    public void enrichWithLikeMetadata(List<ListingResponse> items, User viewer) {
        enrichListingResponsesWithLikes(items, viewer);
    }

    /** Public for use by SavedListingService when building saved list. */
    public ListingResponse buildListingResponse(Listing listing, User currentUser, boolean isSaved) {
        ListingResponse r = toListingResponse(listing, currentUser, isSaved, computeIsFollowed(listing, currentUser));
        enrichSingleListingResponseWithLikes(r, currentUser);
        enrichSellerSummaryWithFollowerCount(r, listing);
        return r;
    }

    /** Chỉ dùng cho chi tiết tin — tránh N+1 count trên danh sách dùng {@link #toListingResponse}. */
    private void enrichSellerSummaryWithFollowerCount(ListingResponse r, Listing listing) {
        if (r == null || listing == null || listing.getSeller() == null) {
            return;
        }
        Object ss = r.getSellerSummary();
        if (!(ss instanceof Map<?, ?> raw)) {
            return;
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> m = (Map<String, Object>) raw;
        m.put("followerCount", followService.countFollowers(listing.getSeller().getId()));
    }

    // ----------------------------------------------------------------
    // Create listing
    // ----------------------------------------------------------------

    @Transactional
    public ListingResponse createListing(User seller, CreateListingRequest request) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        Listing saved = persistNewListing(seller, request);
        log.info("createListing: id={}, status={}, seller={}", saved.getId(), saved.getStatus(), seller.getId());

        ListingResponse created = toListingResponse(saved, seller, false, false);
        enrichSingleListingResponseWithLikes(created, seller);
        return created;
    }

    /**
     * Tạo tin + upload ảnh trong một transaction — tránh lỗi upload sau khi đã commit listing (tin “mồ côi” trong DB).
     */
    @Transactional
    public ListingResponse createListingWithImages(User seller, CreateListingRequest request, List<MultipartFile> images) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        boolean isDraft = request.isDraftMode();
        List<MultipartFile> imageParts = nonEmptyImageParts(images);
        int maxPerPost = getMaxImagesPerPost();

        if (!isDraft) {
            if (imageParts.isEmpty()) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Vui lòng đính kèm ít nhất một ảnh");
            }
        }
        if (!imageParts.isEmpty() && imageParts.size() > maxPerPost) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, Constants.MSG18);
        }

        Listing saved = persistNewListing(seller, request);
        if (!imageParts.isEmpty()) {
            listingImageService.uploadListingImages(saved.getId(), imageParts, seller);
        }
        log.info("createListingWithImages: id={}, status={}, seller={}, images={}", saved.getId(), saved.getStatus(), seller.getId(), imageParts.size());

        ListingResponse created = toListingResponse(saved, seller, false, false);
        enrichSingleListingResponseWithLikes(created, seller);
        return created;
    }

    /**
     * Giới hạn ảnh mỗi tin:
     * - MAX_IMAGES_PER_POST: giới hạn theo từng bài
     * - MAX_IMAGES: trần hệ thống (nếu có) để tránh vượt quá ngưỡng toàn cục
     */
    public int getMaxImagesPerPost() {
        int perPost = Math.max(1, configService.getIntConfigValue("MAX_IMAGES_PER_POST", DEFAULT_MAX_IMAGES_PER_POST));
        int systemCap = Math.max(1, configService.getIntConfigValue("MAX_IMAGES", perPost));
        return Math.min(perPost, systemCap);
    }

    public int getListingExpirationDays() {
        return Math.max(1, configService.getIntConfigValue("LISTING_EXPIRATION", DEFAULT_LISTING_EXPIRATION_DAYS));
    }

    private static List<MultipartFile> nonEmptyImageParts(List<MultipartFile> images) {
        if (images == null) {
            return List.of();
        }
        return images.stream().filter(f -> f != null && !f.isEmpty()).toList();
    }

    private Listing persistNewListing(User seller, CreateListingRequest request) {
        boolean isDraft = request.isDraftMode();

        if (!isDraft && (request.getTitle() == null || request.getTitle().isBlank())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
        }
        if (!isDraft && request.getCategoryId() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
        }
        if (!isDraft && request.getPrice() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không tồn tại"));
        }

        Address pickup = resolvePickupAddress(seller, request);
        if (!isDraft && pickup == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Vui lòng chọn địa điểm giao dịch");
        }

        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setCategory(category);
        listing.setPickupAddress(pickup);
        String title = request.getTitle() != null ? request.getTitle().trim() : "";
        listing.setTitle(!title.isBlank() ? title : "Bản nháp chưa đặt tiêu đề");
        listing.setDescription(request.getDescription());
        listing.setPrice(request.normalizedPrice() != null ? request.normalizedPrice() : java.math.BigDecimal.ZERO);
        listing.setItemCondition(normalizeCondition(request.getCondition()));
        listing.setPurpose(
                request.getPurpose() != null && !request.getPurpose().isBlank()
                        ? request.getPurpose()
                        : "SALE"
        );
        listing.setIsGiveaway(Boolean.TRUE.equals(request.getIsGiveaway()));
        listing.setStatus(isDraft ? "DRAFT" : "ACTIVE");
        listing.setViewCount(0L);
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        listing.setExpirationDate(isDraft ? null : Instant.now().plus(getListingExpirationDays(), ChronoUnit.DAYS));

        return listingRepository.save(listing);
    }

    /**
     * Cập nhật listing hiện có (payload cùng dạng {@link CreateListingRequest} như tạo mới).
     */
    @Transactional
    public ListingResponse updateListing(Long listingId, User seller, CreateListingRequest request) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        boolean isDraft = request.isDraftMode();

        if (!isDraft && (request.getTitle() == null || request.getTitle().isBlank())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
        }
        if (!isDraft && request.getCategoryId() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
        }
        if (!isDraft && request.getPrice() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
        }

        Category category = listing.getCategory();
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không tồn tại"));
        } else if (!isDraft) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
        }

        Address pickup = resolvePickupAddress(seller, request);
        if (!isDraft && pickup == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Vui lòng chọn địa điểm giao dịch");
        }

        listing.setCategory(category);
        listing.setPickupAddress(pickup);
        String title = request.getTitle() != null ? request.getTitle().trim() : "";
        if (!title.isBlank()) {
            listing.setTitle(title);
        } else if (!isDraft) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
        }
        listing.setDescription(request.getDescription());
        if (request.normalizedPrice() != null) {
            listing.setPrice(request.normalizedPrice());
        } else if (!isDraft) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
        }
        listing.setItemCondition(normalizeCondition(request.getCondition()));
        listing.setPurpose(
                request.getPurpose() != null && !request.getPurpose().isBlank()
                        ? request.getPurpose()
                        : "SALE"
        );
        listing.setIsGiveaway(Boolean.TRUE.equals(request.getIsGiveaway()));

        if (isDraft) {
            listing.setStatus("DRAFT");
            listing.setExpirationDate(null);
        } else if ("DRAFT".equals(listing.getStatus())) {
            listing.setStatus("ACTIVE");
            listing.setExpirationDate(Instant.now().plus(getListingExpirationDays(), ChronoUnit.DAYS));
        } else if ("ACTIVE".equals(listing.getStatus()) && listing.getExpirationDate() == null) {
            // Backfill expiration for legacy ACTIVE rows created before LISTING_EXPIRATION was enforced.
            listing.setExpirationDate(Instant.now().plus(getListingExpirationDays(), ChronoUnit.DAYS));
        }

        listing.setUpdatedAt(Instant.now());

        Listing saved = listingRepository.save(listing);
        log.info("updateListing: id={}, status={}, seller={}", saved.getId(), saved.getStatus(), seller.getId());

        ListingResponse updated = toListingResponse(saved, seller, false, false);
        enrichSingleListingResponseWithLikes(updated, seller);
        return updated;
    }

    private Address resolvePickupAddress(User seller, CreateListingRequest request) {
        if (request.getPickupAddressId() != null) {
            return addressRepository.findByIdAndUser_Id(request.getPickupAddressId(), seller.getId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT));
        }
        if (request.getPickupLocationName() == null || request.getPickupLocationName().isBlank()) {
            return null;
        }

        Address addr = new Address();
        addr.setUser(seller);
        String loc = request.getPickupLocationName().trim();
        if (loc.length() > 200) {
            loc = loc.substring(0, 200);
        }
        addr.setLocationName(loc);
        String supplement = request.getPickupAddressSupplement();
        if (supplement != null && !supplement.isBlank()) {
            addr.setAddressText(supplement.trim());
        } else {
            addr.setAddressText(null);
        }
        addr.setLat(request.getPickupLat());
        addr.setLng(request.getPickupLng());
        addr.setIsDefault(false);
        Instant now = Instant.now();
        addr.setCreatedAt(now);
        addr.setUpdatedAt(now);
        return addressRepository.save(addr);
    }

    private ListingResponse toListingResponse(Listing listing, User currentUser, boolean isSaved, boolean isFollowed) {
        ListingResponse response = new ListingResponse();

        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPrice(listing.getPrice());
        response.setCondition(listing.getItemCondition());
        response.setItemCondition(listing.getItemCondition());
        response.setPurpose(listing.getPurpose());
        response.setLocation(resolveLocation(listing));
        response.setStatus(listing.getStatus());
        response.setItemStatus(listing.getStatus());
        response.setCreatedAt(listing.getCreatedAt());
        attachListingImages(response, listing.getId());
        response.setSellerSummary(buildSellerSummary(listing));
        response.setIsGiveaway(listing.getIsGiveaway());

        // pickupAddress object with lat/lng for map display
        Address addr = listing.getPickupAddress();
        if (addr != null) {
            Map<String, Object> paMap = new HashMap<>();
            paMap.put("locationName", addr.getLocationName());
            paMap.put("addressText", addr.getAddressText());
            paMap.put("lat", addr.getLat());
            paMap.put("lng", addr.getLng());
            response.setPickupAddress(paMap);
        }

        // category info
        if (listing.getCategory() != null) {
            Map<String, Object> cat = new HashMap<>();
            cat.put("id", listing.getCategory().getId());
            cat.put("name", listing.getCategory().getName());
            cat.put("parentId", listing.getCategory().getParent() != null ? listing.getCategory().getParent().getId() : null);
            response.setCategory(cat);
        }

        // seller info (redundant path – FE reads both sellerSummary and seller)
        if (listing.getSeller() != null) {
            Map<String, Object> sel = new HashMap<>();
            sel.put("id", listing.getSeller().getId());
            sel.put("fullName", listing.getSeller().getFullName());
            sel.put("avatarUrl", listing.getSeller().getAvatarUrl());
            response.setSeller(sel);
        }

        response.setIsSaved(isSaved);
        response.setIsFollowed(isFollowed);
        response.setLikeCount(0L);
        response.setIsLiked(false);

        return response;
    }



    private Map<Long, Long> likeCountsForListingIds(Collection<Long> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) {
            return Map.of();
        }
        try {
            List<Object[]> rows = listingLikeRepository.countGroupedByListingId(listingIds);
            Map<Long, Long> map = new HashMap<>();
            for (Object[] row : rows) {
                map.put((Long) row[0], (Long) row[1]);
            }
            return map;
        } catch (DataAccessException ex) {
            log.warn("Skip like count enrichment because listing_likes is unavailable: {}", ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage());
            return Map.of();
        }
    }

    private Set<Long> likedListingIdsForUser(Long userId, Collection<Long> listingIds) {
        if (userId == null || listingIds == null || listingIds.isEmpty()) {
            return Set.of();
        }
        try {
            return new HashSet<>(listingLikeRepository.findLikedListingIds(userId, listingIds));
        } catch (DataAccessException ex) {
            log.warn("Skip liked-state enrichment because listing_likes is unavailable: {}", ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage());
            return Set.of();
        }
    }

    private void enrichListingResponsesWithLikes(List<ListingResponse> items, User currentUser) {
        if (items == null || items.isEmpty()) {
            return;
        }
        List<Long> ids = items.stream()
                .map(ListingResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Long> counts = likeCountsForListingIds(ids);
        Set<Long> liked = currentUser != null
                ? likedListingIdsForUser(currentUser.getId(), ids)
                : Set.of();
        for (ListingResponse r : items) {
            Long lid = r.getId();
            if (lid == null) {
                r.setLikeCount(0L);
                r.setIsLiked(false);
                continue;
            }
            r.setLikeCount(counts.getOrDefault(lid, 0L));
            r.setIsLiked(currentUser != null && liked.contains(lid));
        }
    }

    private void enrichListingCardsWithLikes(List<com.slife.marketplace.dto.response.ListingCardResponse> cards, User currentUser) {
        if (cards == null || cards.isEmpty()) {
            return;
        }
        List<Long> ids = cards.stream()
                .map(com.slife.marketplace.dto.response.ListingCardResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Long> counts = likeCountsForListingIds(ids);
        Set<Long> liked = currentUser != null
                ? likedListingIdsForUser(currentUser.getId(), ids)
                : Set.of();
        for (com.slife.marketplace.dto.response.ListingCardResponse c : cards) {
            Long lid = c.getId();
            if (lid == null) {
                c.setLikeCount(0L);
                c.setIsLiked(false);
                continue;
            }
            c.setLikeCount(counts.getOrDefault(lid, 0L));
            c.setIsLiked(currentUser != null && liked.contains(lid));
        }
    }

    private void enrichSingleListingResponseWithLikes(ListingResponse r, User currentUser) {
        if (r == null || r.getId() == null) {
            return;
        }
        try {
            r.setLikeCount(listingLikeRepository.countByListing_Id(r.getId()));
            r.setIsLiked(currentUser != null
                    && listingLikeRepository.existsByUser_IdAndListing_Id(currentUser.getId(), r.getId()));
        } catch (DataAccessException ex) {
            log.warn("Skip single-listing like enrichment because listing_likes is unavailable: {}", ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage());
            r.setLikeCount(0L);
            r.setIsLiked(false);
        }
    }


    private Set<Long> resolveFollowedSellerIds(User currentUser, List<Listing> listings) {
        if (currentUser == null || listings == null || listings.isEmpty()) {
            return Set.of();
        }
        Set<Long> sellerIds = listings.stream()
                .map(l -> l.getSeller() != null ? l.getSeller().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (sellerIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(followService.findFollowedIdsAmong(currentUser.getId(), sellerIds));
    }

    private boolean isFollowedForListing(Listing listing, User currentUser, Set<Long> followedSellerIds) {
        if (currentUser == null || listing.getSeller() == null) {
            return false;
        }
        if (listing.getSeller().getId().equals(currentUser.getId())) {
            return false;
        }
        return followedSellerIds.contains(listing.getSeller().getId());
    }

    private boolean computeIsFollowed(Listing listing, User currentUser) {
        if (currentUser == null || listing.getSeller() == null) {
            return false;
        }
        if (listing.getSeller().getId().equals(currentUser.getId())) {
            return false;
        }
        return followService.isFollowing(currentUser.getId(), listing.getSeller().getId());
    }

    private boolean isSellerBlockingViewer(User seller, User viewer) {
        if (seller == null || viewer == null || seller.getId() == null || viewer.getId() == null) {
            return false;
        }
        if (seller.getId().equals(viewer.getId())) {
            return false;
        }
        return blockService.isBlockedByCurrentUser(seller.getId(), viewer.getId());
    }

    private Object buildSellerSummary(Listing listing) {
        if (listing.getSeller() == null) return null;

        Map<String, Object> seller = new HashMap<>();
        seller.put("userId", listing.getSeller().getId());
        seller.put("fullName", listing.getSeller().getFullName());
        seller.put("avatarUrl", listing.getSeller().getAvatarUrl());

        return seller;
    }

    private String resolveLocation(Listing listing) {
        if (listing.getPickupAddress() == null) return null;
        return AddressFormat.pickupDisplayLine(
                listing.getPickupAddress().getLocationName(),
                listing.getPickupAddress().getAddressText());
    }

    private void attachListingImages(ListingResponse response, Long listingId) {
        List<ListingImage> rows = listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(listingId);
        response.setImageItems(rows.stream()
                .map(img -> new ListingImageItemResponse(img.getId(), img.getImageUrl()))
                .toList());
        response.setImages(rows.stream().map(ListingImage::getImageUrl).toList());
    }

    private void attachListingImages(MyListingResponse response, Long listingId) {
        List<ListingImage> rows = listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(listingId);
        response.setImageItems(rows.stream()
                .map(img -> new ListingImageItemResponse(img.getId(), img.getImageUrl()))
                .toList());
        response.setImages(rows.stream().map(ListingImage::getImageUrl).toList());
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        String[] parts = sort.split(",");
        String rawField = parts[0].trim();
        boolean fieldInvalid = !ALLOWED_SORT_FIELDS.contains(rawField);
        String field = fieldInvalid ? "createdAt" : rawField;

        Sort.Direction direction = Sort.Direction.DESC;
        if (!fieldInvalid && parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.ASC;
        }

        return Sort.by(direction, field);
    }

    private String normalizeParam(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeCondition(String condition) {
        if (condition == null || condition.isBlank()) return "USED_GOOD";
        return switch (condition.trim().toUpperCase()) {
            case "NEW" -> "NEW";
            case "USED_LIKE_NEW" -> "USED_LIKE_NEW";
            case "USED_FAIR" -> "USED_FAIR";
            case "USED_GOOD", "USED", "SECOND_HAND" -> "USED_GOOD";
            default -> "USED_GOOD";
        };
    }

    // ----------------------------------------------------------------
    // My Listings Management
    // ----------------------------------------------------------------

    @Transactional(readOnly = true)
    public PagedResponse<MyListingResponse> getMyListings(String status, int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                size > 0 ? Math.min(size, 20) : 10,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Listing> pageResult;
        if ("REPORTED".equalsIgnoreCase(status)) {
            pageResult = listingRepository.findReportedListingsBySeller(currentUser, pageable);
        } else if ("EXPIRED".equalsIgnoreCase(status)) {
            pageResult = listingRepository.findExpiredListingsBySeller(currentUser, pageable);
        } else if ("HIDDEN".equalsIgnoreCase(status)) {
            pageResult = listingRepository.findHiddenNotExpiredBySeller(currentUser, pageable);
        } else if (status != null && !status.isBlank()) {
            pageResult = listingRepository.findBySellerAndStatus(currentUser, status.toUpperCase(), pageable);
        } else {
            pageResult = listingRepository.findBySellerOrderByCreatedAtDesc(currentUser, pageable);
        }

        List<MyListingResponse> content = pageResult.getContent().stream()
                .map(this::toMyListingResponse)
                .toList();

        return new PagedResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    private MyListingResponse toMyListingResponse(Listing listing) {
        MyListingResponse response = new MyListingResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPrice(listing.getPrice());
        response.setCondition(listing.getItemCondition());
        response.setLocation(resolveLocation(listing));
        response.setCreatedAt(listing.getCreatedAt());
        response.setUpdatedAt(listing.getUpdatedAt());
        attachListingImages(response, listing.getId());
        response.setStatus(listing.getStatus());
        response.setPurpose(listing.getPurpose());
        response.setIsGiveaway(listing.getIsGiveaway());
        response.setExpirationDate(listing.getExpirationDate());
        response.setCategoryName(listing.getCategory() != null ? listing.getCategory().getName() : null);
        response.setReportCount(listingRepository.countReportsByListingId(listing.getId()));
        return response;
    }

    // ----------------------------------------------------------------
    // Hide / Unhide
    // ----------------------------------------------------------------

    @Transactional
    public void hideListing(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        listing.setStatus("HIDDEN");
        listing.setUpdatedAt(Instant.now());
        listingRepository.save(listing);
    }

    @Transactional
    public void unhideListing(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        String status = listing.getStatus() != null ? listing.getStatus().trim().toUpperCase() : "";
        if (!"HIDDEN".equals(status)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ có thể bỏ ẩn tin do chính bạn đã ẩn");
        }

        listing.setStatus("ACTIVE");
        listing.setUpdatedAt(Instant.now());
        listingRepository.save(listing);
    }

    @Transactional
    public void markSold(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        if (!"ACTIVE".equals(listing.getStatus()) && !"HIDDEN".equals(listing.getStatus())) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Chỉ có thể đánh dấu SOLD cho tin ACTIVE/HIDDEN");
        }

        listing.setStatus("SOLD");
        listing.setUpdatedAt(Instant.now());
        listingRepository.save(listing);
    }

    // ----------------------------------------------------------------
    // Renew Listing
    // ----------------------------------------------------------------

    @Transactional
    public void renewListing(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        if (!"ACTIVE".equals(listing.getStatus())) {
            throw new SlifeException(ErrorCode.LISTING_NOT_RENEWABLE);
        }

        Instant now = Instant.now();
        Instant expiry = listing.getExpirationDate();

        if (expiry == null || expiry.isBefore(now)) {
            throw new SlifeException(ErrorCode.LISTING_NOT_RENEWABLE);
        }

        long daysUntilExpiry = ChronoUnit.DAYS.between(now, expiry);
        if (daysUntilExpiry > 7) {
            throw new SlifeException(ErrorCode.LISTING_NOT_RENEWABLE);
        }

        listing.setExpirationDate(now.plus(getListingExpirationDays(), ChronoUnit.DAYS));
        listing.setUpdatedAt(now);
        listingRepository.save(listing);
    }

    // ----------------------------------------------------------------
    // Repost Listing (EXPIRED → ACTIVE)
    // ----------------------------------------------------------------

    @Transactional
    public void repostListing(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        Instant now = Instant.now();

        boolean isFunctionallyExpired = "EXPIRED".equals(listing.getStatus())
                || (listing.getExpirationDate() != null && listing.getExpirationDate().isBefore(now));

        boolean isBlockedStatus = "BANNED".equals(listing.getStatus())
                || "SOLD".equals(listing.getStatus())
                || "GIVEN_AWAY".equals(listing.getStatus());

        if (!isFunctionallyExpired || isBlockedStatus) {
            throw new SlifeException(ErrorCode.LISTING_NOT_EXPIRED);
        }

        listing.setStatus("ACTIVE");
        listing.setExpirationDate(now.plus(getListingExpirationDays(), ChronoUnit.DAYS));
        listing.setUpdatedAt(now);
        listingRepository.save(listing);
    }

    // ----------------------------------------------------------------
    // Delete Draft
    // ----------------------------------------------------------------

    @Transactional
    public void deleteDraft(Long id, User currentUser) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        if (!"DRAFT".equals(listing.getStatus())) {
            throw new SlifeException(ErrorCode.LISTING_NOT_DRAFT);
        }

        listingImageRepository.deleteByListing_Id(id);
        listingRepository.delete(listing);
    }
}