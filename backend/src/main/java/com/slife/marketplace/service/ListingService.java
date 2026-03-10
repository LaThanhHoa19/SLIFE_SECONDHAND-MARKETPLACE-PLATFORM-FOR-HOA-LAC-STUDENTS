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

    private static final String DEFAULT_CONDITION = "USED_GOOD";
    private static final String DEFAULT_PURPOSE = "SALE";
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXT = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final ListingImageRepository listingImageRepository;
    private final Path uploadBasePath;

    public ListingService(ListingRepository listingRepository,
                          CategoryRepository categoryRepository,
                          ListingImageRepository listingImageRepository,
                          Path uploadBasePath) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.listingImageRepository = listingImageRepository;
        this.uploadBasePath = uploadBasePath;
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

    private ListingResponse toListingResponse(Listing listing) {
        ListingResponse response = new ListingResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setImages(findImageUrls(listing.getId()));
        response.setSellerSummary(buildSellerSummary(listing));
        response.setIsSaved(false);
        response.setIsFollowed(false);
        return response;
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

    private String getImageExtension(String filename) {
        String ext = (filename != null && filename.contains(".")) ? filename.substring(filename.lastIndexOf(".")).toLowerCase() : ".jpg";
        return Arrays.asList(ALLOWED_EXT).contains(ext) ? ext : ".jpg";
    }
}