package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ListingPageResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mục đích: Service ListingService
 * Endpoints liên quan: controller
 */
@Service
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
     * Trả về danh sách listing (có kèm ảnh).
     * Filter theo category và/hoặc location nếu truyền vào.
     */
    public List<ListingResponse> getListings(Long categoryId, String location) {
        List<Listing> listings;
        if (categoryId != null && location != null && !location.isBlank()) {
            listings = listingRepository.findByStatusAndCategory_IdAndPickupAddress_LocationNameOrderByCreatedAtDesc("ACTIVE", categoryId, location);
        } else if (categoryId != null) {
            listings = listingRepository.findByStatusAndCategory_IdOrderByCreatedAtDesc("ACTIVE", categoryId);
        } else if (location != null && !location.isBlank()) {
            listings = listingRepository.findByStatusAndPickupAddress_LocationNameOrderByCreatedAtDesc("ACTIVE", location);
        } else {
            listings = listingRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        }
        return listings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** @deprecated Dùng getListings(categoryId, location) */
    public List<ListingResponse> getAllListingsForTest() {
        return getListings(null, null);
    }

    /**
     * Filter listings theo category, location, keyword với pagination.
     * Tối ưu query &lt;500ms với index.
     */
    public ListingPageResponse getFilteredListings(Long categoryId, String location, String q,
                                                   String sort, int page, int size) {
        Sort s = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, s);
        var pageResult = listingRepository.findByFilters(categoryId, location, q, pageable);
        List<ListingResponse> content = pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new ListingPageResponse(content, pageResult.getTotalPages(), pageResult.getTotalElements());
    }

    private static Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) return Sort.by(Sort.Direction.DESC, "createdAt");
        String[] parts = sort.split(",");
        String prop = parts[0].trim();
        boolean asc = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim());
        if ("price".equalsIgnoreCase(prop)) return Sort.by(asc ? Sort.Direction.ASC : Sort.Direction.DESC, "price");
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    /**
     * Chi tiết một listing (có ảnh).
     */
    public ListingResponse getListingById(Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        return toResponse(listing);
    }

    private List<String> getImageUrls(Long listingId) {
        return listingImageRepository.findByListing_IdOrderByDisplayOrderAsc(listingId).stream()
                .map(ListingImage::getImageUrl)
                .collect(Collectors.toList());
    }

    @Transactional
    public Listing createListing(User seller, CreateListingRequest req) {
        if (seller == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        if (req == null || req.getTitle() == null || req.getTitle().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setTitle(req.getTitle().trim());
        listing.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        BigDecimal price = req.getPrice() != null ? req.getPrice() : BigDecimal.ZERO;
        Boolean isGiveaway = Boolean.TRUE.equals(req.getIsGiveaway());
        if (isGiveaway) {
            price = BigDecimal.ZERO;
        }
        listing.setPrice(price);
        listing.setIsGiveaway(isGiveaway);
        listing.setItemCondition(req.getCondition() != null && !req.getCondition().isBlank()
                ? req.getCondition().trim().toUpperCase() : DEFAULT_CONDITION);
        listing.setPurpose(req.getPurpose() != null && !req.getPurpose().isBlank()
                ? req.getPurpose().trim().toUpperCase() : DEFAULT_PURPOSE);
        listing.setStatus("ACTIVE");
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(listing::setCategory);
        }
        listing.setPickupAddress(null);
        listing.setExpirationDate(null);
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        return listingRepository.save(listing);
    }

    public ListingResponse toResponse(Listing listing) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());
        res.setDescription(listing.getDescription());
        res.setPrice(listing.getPrice());
        res.setIsGiveaway(listing.getIsGiveaway() != null && listing.getIsGiveaway());
        res.setImages(getImageUrls(listing.getId()));
        res.setSellerSummary(
                listing.getSeller() != null ? listing.getSeller().getFullName() : null
        );
        res.setIsSaved(false);
        res.setIsFollowed(false);
        return res;
    }

    /**
     * Upload ảnh cho listing: lưu file vào uploads/listings/{listingId}/, ghi bảng listing_images.
     * Chỉ seller của listing mới được upload.
     */
    @Transactional
    public void uploadListingImages(Long listingId, User currentUser, List<MultipartFile> files) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        if (files == null || files.isEmpty()) {
            return;
        }
        Path dir = uploadBasePath.resolve("listings").resolve(listingId.toString());
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }
        int nextOrder = listingImageRepository.countByListing_Id(listingId) + 1;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            if (file.getSize() > MAX_IMAGE_SIZE) continue;
            String ext = getImageExtension(file.getOriginalFilename());
            String filename = System.currentTimeMillis() + "_" + nextOrder + ext;
            Path target = dir.resolve(filename).normalize();
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
            String url = "/uploads/listings/" + listingId + "/" + filename;
            ListingImage img = new ListingImage();
            img.setListing(listing);
            img.setImageUrl(url);
            img.setDisplayOrder(nextOrder);
            img.setCreatedAt(Instant.now());
            listingImageRepository.save(img);
            nextOrder++;
        }
    }

    private static String getImageExtension(String filename) {
        if (filename == null || filename.isBlank()) return ".jpg";
        int i = filename.lastIndexOf('.');
        if (i <= 0) return ".jpg";
        String ext = filename.substring(i).toLowerCase();
        for (String e : ALLOWED_EXT) {
            if (ext.equals(e)) return ext;
        }
        return ".jpg";
    }
}
