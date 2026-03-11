package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;

    public ListingService(ListingRepository listingRepository,
                          ListingImageRepository listingImageRepository) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
    }

    /**
     * UC-32 & UC-34: Unified Paged & Filtered Search
     */
    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getFilteredListings(
            Long categoryId,
            String location,
            String q,
            String sort,
            int page,
            int size,
            User currentUser) {

        Sort s = parseSort(sort);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                size > 0 ? Math.min(size, 20) : 10,
                s
        );

        Page<Listing> pageResult =
                listingRepository.findByFilters(categoryId, location, q, pageable);

        List<ListingResponse> content = pageResult
                .getContent()
                .stream()
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

    /**
     * Convert Entity -> Response DTO
     */
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

        // TODO: sau này connect bảng saved + follow
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

        if (sort == null || !sort.contains(",")) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        String[] parts = sort.split(",");

        return Sort.by(
                "asc".equalsIgnoreCase(parts[1])
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC,
                parts[0]
        );
    }
}