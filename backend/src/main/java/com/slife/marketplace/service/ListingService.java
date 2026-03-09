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

    @Transactional
    public Listing createListing(User seller, CreateListingRequest req) {
        if (seller == null) throw new SlifeException(ErrorCode.UNAUTHORIZED);
        if (req.getTitle() == null || req.getTitle().isBlank()) throw new SlifeException(ErrorCode.INVALID_INPUT);

        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setTitle(req.getTitle().trim());
        listing.setDescription(req.getDescription());

        // BR-11: Giveaway logic (Price 0)
        BigDecimal price = Boolean.TRUE.equals(req.getIsGiveaway()) ? BigDecimal.ZERO : (req.getPrice() != null ? req.getPrice() : BigDecimal.ZERO);
        listing.setPrice(price);
        listing.setIsGiveaway(Boolean.TRUE.equals(req.getIsGiveaway()));
        
        listing.setItemCondition(req.getCondition() != null ? req.getCondition().toUpperCase() : DEFAULT_CONDITION);
        listing.setStatus("DRAFT"); // BR-31: Default state
        
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(listing::setCategory);
        }

        listing.setCreatedAt(Instant.now());
        return listingRepository.save(listing);
    }

    @Transactional
    public void uploadListingImages(Long listingId, User currentUser, List<MultipartFile> files) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        Path dir = uploadBasePath.resolve("listings").resolve(listingId.toString());
        try {
            Files.createDirectories(dir);
            int nextOrder = listingImageRepository.countByListing_Id(listingId) + 1;

            for (MultipartFile file : files) {
                if (file.isEmpty() || file.getSize() > MAX_IMAGE_SIZE) continue;

                String filename = System.currentTimeMillis() + "_" + nextOrder + getImageExtension(file.getOriginalFilename());
                Path target = dir.resolve(filename);

                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                    saveImageRecord(listing, "/uploads/listings/" + listingId + "/" + filename, nextOrder++);
                }
            }
        } catch (IOException e) {
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    private void saveImageRecord(Listing listing, String url, int order) {
        ListingImage img = new ListingImage();
        img.setListing(listing);
        img.setImageUrl(url);
        img.setDisplayOrder(order);
        img.setCreatedAt(Instant.now());
        listingImageRepository.save(img);
    }

    public ListingResponse toResponse(Listing listing, User currentUser) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());
        res.setDescription(listing.getDescription());
        res.setPrice(listing.getPrice());
        res.setIsGiveaway(Boolean.TRUE.equals(listing.getIsGiveaway()));
        res.setCondition(listing.getItemCondition());
        res.setStatus(listing.getStatus());
        res.setCreatedAt(listing.getCreatedAt());
        res.setImages(findImageUrls(listing.getId()));
        
        // Seller details and Context
        if (listing.getSeller() != null) {
            res.setSellerId(listing.getSeller().getId());
            res.setSellerSummary(buildSellerSummary(listing.getSeller()));
            res.setIsOwnListing(currentUser != null && currentUser.getId().equals(listing.getSeller().getId()));
        }
        
        return res;
    }

    private Map<String, Object> buildSellerSummary(User seller) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("fullName", seller.getFullName());
        summary.put("avatarUrl", seller.getAvatarUrl());
        summary.put("reputation", seller.getReputationScore());
        return summary;
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