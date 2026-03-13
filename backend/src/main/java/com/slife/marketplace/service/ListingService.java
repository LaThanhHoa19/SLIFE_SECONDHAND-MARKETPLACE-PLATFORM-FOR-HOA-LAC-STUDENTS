package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
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

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
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

        List<ListingResponse> content = pageResult.getContent().stream()
                .map(listing -> toListingResponse(listing, currentUser))
                .toList();

        return new PagedResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }


    private ListingResponse toListingResponse(Listing listing, User currentUser) {
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

        response.setIsSaved(false);
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
}