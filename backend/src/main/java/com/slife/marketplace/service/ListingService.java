package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.temporal.ChronoUnit;
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

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository,
                          SavedListingRepository savedListingRepository) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.savedListingRepository = savedListingRepository;
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