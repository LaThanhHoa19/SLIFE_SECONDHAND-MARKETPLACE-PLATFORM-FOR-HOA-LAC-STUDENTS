package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.PickupAddressResponse;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
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

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final SavedListingRepository savedListingRepository;
    private final CategoryRepository categoryRepository;
    private final AddressRepository addressRepository;
    private final FollowService followService;
    private final ListingLikeRepository listingLikeRepository;
    private final ListingImageService listingImageService;
    private final VietmapService vietmapService;

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository,
                          SavedListingRepository savedListingRepository,
                          CategoryRepository categoryRepository,
                          AddressRepository addressRepository,
                          FollowService followService,
                          ListingLikeRepository listingLikeRepository,
                          ListingImageService listingImageService,
                          VietmapService vietmapService) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.savedListingRepository = savedListingRepository;
        this.categoryRepository = categoryRepository;
        this.addressRepository = addressRepository;
        this.followService = followService;
        this.listingLikeRepository = listingLikeRepository;
        this.listingImageService = listingImageService;
        this.vietmapService = vietmapService;
    }

    // ----------------------------------------------------------------
    // Public listing search
    // ----------------------------------------------------------------

    @Transactional(readOnly = true)
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

        List<Listing> listings = pageResult.getContent();
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
    @Transactional(readOnly = true)
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
                new java.util.ArrayList<>(pageResult.getContent());
        if (currentUser != null && !content.isEmpty()) {
            Set<Long> sellerIds = content.stream()
                    .map(com.slife.marketplace.dto.response.ListingCardResponse::getSellerId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<Long> followed = sellerIds.isEmpty()
                    ? Set.of()
                    : new HashSet<>(followService.findFollowedIdsAmong(currentUser.getId(), sellerIds));
            for (com.slife.marketplace.dto.response.ListingCardResponse card : content) {
                Long sid = card.getSellerId();
                boolean f = sid != null
                        && !sid.equals(currentUser.getId())
                        && followed.contains(sid);
                card.setIsFollowed(f);
            }
        } else {
            for (com.slife.marketplace.dto.response.ListingCardResponse card : content) {
                card.setIsFollowed(false);
            }
        }

        enrichListingCardsWithLikes(content, currentUser);

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
    @Transactional(readOnly = true)
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

        boolean isDraft = request.isDraftMode();

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
        }
        if (request.getCategoryId() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
        }
        if (request.getPrice() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không tồn tại"));

        Address pickup = resolvePickupAddress(seller, request);

        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setCategory(category);
        listing.setPickupAddress(pickup);
        listing.setTitle(request.getTitle().trim());
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

        Listing saved = listingRepository.save(listing);
        log.info("createListing: id={}, status={}, seller={}", saved.getId(), saved.getStatus(), seller.getId());

        ListingResponse created = toListingResponse(saved, seller, false, false);
        enrichSingleListingResponseWithLikes(created, seller);
        return created;
    }

    /**
     * Tạo tin + upload ảnh (nếu có) trong một transaction, để tránh đã lưu listing khi vượt MAX_IMAGES_PER_POST.
     */
    @Transactional
    public ListingResponse createListingWithOptionalImages(User seller, CreateListingRequest request, List<MultipartFile> imageFiles) {
        listingImageService.assertImageBatchWithinLimit(0, imageFiles);
        ListingResponse created = createListing(seller, request);
        if (imageFiles != null && imageFiles.stream().anyMatch(f -> f != null && !f.isEmpty())) {
            listingImageService.uploadListingImages(created.getId(), imageFiles);
        }
        return created;
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

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
        }
        if (request.getCategoryId() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
        }
        if (request.getPrice() == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không tồn tại"));

        Address pickup = resolvePickupAddress(seller, request);

        listing.setCategory(category);
        listing.setPickupAddress(pickup);
        listing.setTitle(request.getTitle().trim());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.normalizedPrice() != null ? request.normalizedPrice() : java.math.BigDecimal.ZERO);
        listing.setItemCondition(normalizeCondition(request.getCondition()));
        listing.setPurpose(
                request.getPurpose() != null && !request.getPurpose().isBlank()
                        ? request.getPurpose()
                        : "SALE"
        );
        listing.setIsGiveaway(Boolean.TRUE.equals(request.getIsGiveaway()));

        if (isDraft) {
            listing.setStatus("DRAFT");
        } else if ("DRAFT".equals(listing.getStatus())) {
            listing.setStatus("ACTIVE");
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

        assertPinWithinSelectedAdminArea(request);

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

    private void assertPinWithinSelectedAdminArea(CreateListingRequest request) {
        if (request == null) return;
        if (request.getPickupLat() == null || request.getPickupLng() == null) return;

        String chosenProvince = normalizeVi(request.getPickupProvince());
        String chosenDistrict = normalizeVi(request.getPickupDistrict());
        String chosenWard = normalizeVi(request.getPickupWard());
        if (chosenProvince.isEmpty() && chosenDistrict.isEmpty() && chosenWard.isEmpty()) {
            return; // không chọn khu vực hành chính => không validate
        }

        // 1) Prefer bbox validation (most robust against reverse naming quirks)
        try {
            var bboxOpt = vietmapService.osmAdminBbox(
                    request.getPickupProvince(),
                    request.getPickupDistrict(),
                    request.getPickupWard()
            );
            if (bboxOpt.isPresent()) {
                var bb = bboxOpt.get();
                double minLat = ((Number) bb.get("minLat")).doubleValue();
                double maxLat = ((Number) bb.get("maxLat")).doubleValue();
                double minLng = ((Number) bb.get("minLng")).doubleValue();
                double maxLng = ((Number) bb.get("maxLng")).doubleValue();
                double lat = request.getPickupLat().doubleValue();
                double lng = request.getPickupLng().doubleValue();
                boolean inside = lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
                if (inside) {
                    return;
                }
                // Bbox có mà pin nằm ngoài => chặn chắc chắn
                throw new SlifeException(
                        ErrorCode.INVALID_INPUT,
                        "Vị trí ghim không thuộc khu vực đã chọn. Vui lòng ghim lại trong đúng khu vực."
                );
            }
        } catch (Exception ignored) {
            // ignore bbox errors and fallback to reverse-name matching
        }

        // Nếu không lấy được bbox (OSM search fail), tránh chặn nhầm: FE đã validate sớm.
        // Server vẫn có thể validate lại khi bbox reverse ổn định.
        log.warn("Pin validation skipped (bbox unavailable). province='{}', district='{}', ward='{}'",
                request.getPickupProvince(), request.getPickupDistrict(), request.getPickupWard());
    }

    private static String normalizeVi(String s) {
        if (s == null) return "";
        String t = s.trim().toLowerCase();
        if (t.isEmpty()) return "";
        t = t.replace('đ', 'd');
        t = Normalizer.normalize(t, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return t;
    }

    private ListingResponse toListingResponse(Listing listing, User currentUser, boolean isSaved, boolean isFollowed) {
        ListingResponse response = new ListingResponse();

        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPrice(listing.getPrice());
        response.setCondition(listing.getItemCondition());
        response.setLocation(resolveLocation(listing));
        response.setPickupAddress(toPickupAddressResponse(listing.getPickupAddress()));
        response.setCreatedAt(listing.getCreatedAt());
        response.setImages(findImageUrls(listing.getId()));
        response.setSellerSummary(buildSellerSummary(listing));

        response.setIsSaved(isSaved);
        response.setIsFollowed(isFollowed);
        response.setLikeCount(0L);
        response.setIsLiked(false);

        return response;
    }

    private PickupAddressResponse toPickupAddressResponse(Address a) {
        if (a == null) return null;
        return PickupAddressResponse.builder()
                .locationName(a.getLocationName())
                .addressText(a.getAddressText())
                .lat(a.getLat())
                .lng(a.getLng())
                .build();
    }

    private Map<Long, Long> likeCountsForListingIds(Collection<Long> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = listingLikeRepository.countGroupedByListingId(listingIds);
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    private Set<Long> likedListingIdsForUser(Long userId, Collection<Long> listingIds) {
        if (userId == null || listingIds == null || listingIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(listingLikeRepository.findLikedListingIds(userId, listingIds));
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
        r.setLikeCount(listingLikeRepository.countByListing_Id(r.getId()));
        r.setIsLiked(currentUser != null
                && listingLikeRepository.existsByUser_IdAndListing_Id(currentUser.getId(), r.getId()));
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

    private List<String> findImageUrls(Long listingId) {
        return listingImageRepository
                .findByListing_IdOrderByDisplayOrderAsc(listingId)
                .stream()
                .map(ListingImage::getImageUrl)
                .toList();
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
        response.setImages(findImageUrls(listing.getId()));
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

        listing.setStatus("ACTIVE");
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

        listing.setExpirationDate(now.plus(15, ChronoUnit.DAYS));
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
        listing.setExpirationDate(now.plus(30, ChronoUnit.DAYS));
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