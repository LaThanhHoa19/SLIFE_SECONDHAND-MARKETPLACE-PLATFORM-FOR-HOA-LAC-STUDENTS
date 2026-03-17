package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
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
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.SavedListingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class ListingService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "price", "title");

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final SavedListingRepository savedListingRepository;
    private final CategoryRepository categoryRepository;
    private final AddressRepository addressRepository;

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository,
                          SavedListingRepository savedListingRepository,
                          CategoryRepository categoryRepository,
                          AddressRepository addressRepository) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.savedListingRepository = savedListingRepository;
        this.categoryRepository = categoryRepository;
        this.addressRepository = addressRepository;
    }


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
                null,   // purpose: khong filter tren trang listing chinh
                null,   // itemCond: khong filter tren trang listing chinh
                null,   // priceMin
                null,   // priceMax
                pageable
        );

        Set<Long> savedIds = currentUser != null
                ? new java.util.HashSet<>(savedListingRepository.findListingIdsByUserId(currentUser.getId()))
                : Set.of();

        List<ListingResponse> content = pageResult.getContent().stream()
                .map(listing -> toListingResponse(listing, currentUser, savedIds.contains(listing.getId())))
                .toList();

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
    public PagedResponse<com.slife.marketplace.dto.response.ListingCardResponse> getActiveListingCards(int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                size > 0 ? Math.min(size, 20) : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<com.slife.marketplace.dto.response.ListingCardResponse> pageResult = 
            listingRepository.findAllActiveListingCards(pageable);

        return new PagedResponse<>(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }



    /** Public for use by SavedListingService when building saved list. */
    public ListingResponse buildListingResponse(Listing listing, User currentUser, boolean isSaved) {
        return toListingResponse(listing, currentUser, isSaved);
    }

    /**
     * Tạo listing mới từ request + user hiện tại.
     *  - Nếu pickupAddressId != null: dùng address có sẵn của user.
     *  - Nếu có pickupLocationName + lat/lng: tạo Address mới.
     *  - Status mặc định: ACTIVE.
     */
    @Transactional
    public ListingResponse createListing(User seller, CreateListingRequest request) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        boolean isDraft = request.isDraftMode();

        // Validate bắt buộc chỉ khi ĐĂNG TIN THẬT (không phải nháp)
        if (!isDraft) {
            if (request.getTitle() == null || request.getTitle().isBlank()) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Tiêu đề không được để trống");
            }
            if (request.getCategoryId() == null) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không được để trống");
            }
            if (request.getPrice() == null) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Giá không được để trống");
            }
        }

        // Category: bắt buộc khi đăng thật, tùy chọn khi lưu nháp
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Danh mục không tồn tại"));
        }

        Address pickup = resolvePickupAddress(seller, request);

        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setCategory(category);
        listing.setPickupAddress(pickup);
        listing.setTitle(
                request.getTitle() != null && !request.getTitle().isBlank()
                        ? request.getTitle()
                        : "Nháp chưa đặt tên"
        );
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
        listing.setCreatedAt(java.time.Instant.now());
        listing.setUpdatedAt(java.time.Instant.now());

        Listing saved = listingRepository.save(listing);
        log.info("createListing: id={}, status={}, seller={}", saved.getId(), saved.getStatus(), seller.getId());

        return toListingResponse(saved, seller, false);
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
        addr.setLocationName(request.getPickupLocationName());
        addr.setAddressText(request.getPickupAddressText());
        addr.setLat(request.getPickupLat());
        addr.setLng(request.getPickupLng());
        addr.setIsDefault(false);
        java.time.Instant now = java.time.Instant.now();
        addr.setCreatedAt(now);
        addr.setUpdatedAt(now);
        return addressRepository.save(addr);
    }

    private ListingResponse toListingResponse(Listing listing, User currentUser, boolean isSaved) {
        ListingResponse response = new ListingResponse();

        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPrice(listing.getPrice());
        response.setCondition(listing.getItemCondition());
        response.setLocation(resolveLocation(listing));
        response.setCreatedAt(listing.getCreatedAt());
        response.setImages(findImageUrls(listing.getId()));
        response.setSellerSummary(buildSellerSummary(listing));

        response.setIsSaved(isSaved);
        response.setIsFollowed(false);

        return response;
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

        String locationName = listing.getPickupAddress().getLocationName();

        if (locationName != null && !locationName.isBlank()) {
            return locationName;
        }

        return listing.getPickupAddress().getAddressText();
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
        String field = parts[0].trim();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            field = "createdAt";
        }

        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
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

    /**
     * Ánh xạ giá trị condition từ FE về ENUM hợp lệ của DB:
     * DB enum: NEW, USED_LIKE_NEW, USED_GOOD, USED_FAIR
     */
    private String normalizeCondition(String condition) {
        if (condition == null || condition.isBlank()) return "USED_GOOD";
        return switch (condition.trim().toUpperCase()) {
            case "NEW"          -> "NEW";
            case "USED_LIKE_NEW" -> "USED_LIKE_NEW";
            case "USED_FAIR"    -> "USED_FAIR";
            case "USED_GOOD", "USED", "SECOND_HAND" -> "USED_GOOD";
            default             -> "USED_GOOD";
        };
    }
}