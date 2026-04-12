package com.slife.marketplace.service;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.storage.FileStorage;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

@Service
public class ListingImageService {

    private static final Logger log = LoggerFactory.getLogger(ListingImageService.class);
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    /** Đồng bộ với frontend (ImageUploader / ListingForm: tối đa 10 ảnh/tin). */
    private static final int DEFAULT_MAX_IMAGES_PER_POST = 10;
    private static final String[] ALLOWED_EXT = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final ConfigService configService;
    private final UserFileStorageService fileStorage;
    private final FileStorage fileStorage;
    private final Path uploadBasePath;

    public ListingImageService(ListingRepository listingRepository,
                               ListingImageRepository listingImageRepository,
                               ConfigService configService,
                               FileStorage fileStorage,
                               Path uploadBasePath) {
                               UserFileStorageService fileStorage) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.configService = configService;
        this.fileStorage = fileStorage;
        this.fileStorage = fileStorage;
        this.uploadBasePath = uploadBasePath;
    }

    @Transactional
    public void uploadListingImages(Long listingId, List<MultipartFile> files, User currentUser) {
        if (files == null || files.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "No images uploaded");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        if (currentUser == null || listing.getSeller() == null || !listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        int existingCount = listingImageRepository.countByListing_Id(listingId);
        int maxPerPost = Math.max(1, configService.getIntConfigValue("MAX_IMAGES_PER_POST", DEFAULT_MAX_IMAGES_PER_POST));
        int systemCap = Math.max(1, configService.getIntConfigValue("MAX_IMAGES", maxPerPost));
        int maxImagesPerPost = Math.min(maxPerPost, systemCap);
        if (existingCount + files.size() > maxImagesPerPost) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, Constants.MSG18);
        }
        int displayOrder = existingCount + 1;

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new SlifeException(ErrorCode.FILE_TOO_LARGE);
            }
            String ext = getImageExtension(file.getOriginalFilename());
            String filename = listingId + "_" + System.currentTimeMillis() + "_" + displayOrder + ext;
            String url = fileStorage.storeMultipart(file, "listings/" + filename);
            Path dir = uploadBasePath.resolve("listings");
            try {
                fileStorage.createDirectories(dir);
                Path target = dir.resolve(filename).normalize();
                try (InputStream in = file.getInputStream()) {
                    fileStorage.copy(in, target);
                }
            } catch (IOException e) {
                log.error("uploadListingImages failed listingId={}", listingId, e);
                throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
            }

            String url = "/uploads/listings/" + filename;

            ListingImage image = new ListingImage();
            image.setListing(listing);
            image.setImageUrl(url);
            image.setDisplayOrder(displayOrder++);
            image.setCreatedAt(Instant.now());
            listingImageRepository.save(image);
        }
    }

    private String getImageExtension(String filename) {
        if (filename == null) return ".jpg";
        String lower = filename.toLowerCase();
        for (String ext : ALLOWED_EXT) {
            if (lower.endsWith(ext)) return ext;
        }
        return ".jpg";
    }

    /**
     * Xóa một ảnh của tin (chỉ chủ tin); đồng thời xóa file trong thư mục upload nếu an toàn.
     */
    @Transactional
    public void deleteListingImage(Long listingId, Long imageId, User currentUser) {
        if (currentUser == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        ListingImage img = listingImageRepository.findById(imageId)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Image not found"));
        if (!img.getListing().getId().equals(listingId)) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        fileStorage.deleteStoredIfExists(img.getImageUrl());
        listingImageRepository.delete(img);
    }

    private void deleteStoredFileIfSafe(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }
        try {
            String relative = imageUrl.substring("/uploads/".length());
            Path base = uploadBasePath.toAbsolutePath().normalize();
            Path target = base.resolve(relative).normalize();
            if (!target.startsWith(base)) {
                log.warn("Refusing to delete outside upload dir: {}", imageUrl);
                return;
            }
            fileStorage.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete listing image file: {}", imageUrl, e);
        }
    }
}

