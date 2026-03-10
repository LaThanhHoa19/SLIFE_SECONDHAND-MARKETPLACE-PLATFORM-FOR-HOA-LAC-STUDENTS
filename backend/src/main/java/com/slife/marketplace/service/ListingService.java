package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;

@Service
@Slf4j
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;

    public ListingService(ListingRepository listingRepository,
                          com.slife.marketplace.repository.CategoryRepository categoryRepository,
                          ListingImageRepository listingImageRepository,
                          Path uploadBasePath) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
    }

    /**
     * UC-32 & UC-34: Unified Paged & Filtered Search
     */
    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getFilteredListings(Long categoryId, String location, String q,
                                                              String sort, int page, int size, User currentUser) {
        Sort s = parseSort(sort);
        Pageable pageable = PageRequest.of(Math.max(page, 0), size > 0 ? Math.min(size, 20) : 10, s);

        Page<Listing> pageResult = listingRepository.findByFilters(categoryId, location, q, pageable);

        List<ListingResponse> content = pageResult.getContent().stream()
                .map(l -> toResponse(l, currentUser))
                .toList();

        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(),
                pageResult.getTotalElements(), pageResult.getTotalPages());
    }

    public ListingResponse toResponse(Listing listing, User currentUser) {
        ListingResponse response = new ListingResponse();
        response.setId(listing.getId());
        response.setSellerId(listing.getSeller() != null ? listing.getSeller().getId() : null);
        response.setTitle(listing.getTitle());
        response.setImages(findImageUrls(listing.getId()));
        response.setSellerSummary(buildSellerSummary(listing));
        response.setIsOwnListing(currentUser != null && listing.getSeller() != null
                && Objects.equals(currentUser.getId(), listing.getSeller().getId()));
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


    private List<String> findImageUrls(Long listingId) {
        return listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(listingId)
                .stream().map(ListingImage::getImageUrl).toList();
    }

    private Sort parseSort(String sort) {
        if (sort == null || !sort.contains(",")) return Sort.by(Sort.Direction.DESC, "createdAt");
        String[] parts = sort.split(",");
        return Sort.by("asc".equalsIgnoreCase(parts[1]) ? Sort.Direction.ASC : Sort.Direction.DESC, parts[0]);
    }

}