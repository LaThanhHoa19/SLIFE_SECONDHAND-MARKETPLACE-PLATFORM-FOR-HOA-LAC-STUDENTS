package com.slife.marketplace.service;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.ListingImage;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingImageRepository;
import com.slife.marketplace.repository.ListingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;

@Service
public class ListingImageService {

    private static final Logger log = LoggerFactory.getLogger(ListingImageService.class);
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXT = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final Path uploadBasePath;

    public ListingImageService(ListingRepository listingRepository,
                               ListingImageRepository listingImageRepository,
                               Path uploadBasePath) {
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.uploadBasePath = uploadBasePath;
    }

    @Transactional
    public void uploadListingImages(Long listingId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "No images uploaded");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        int existingCount = listingImageRepository.countByListing_Id(listingId);
        int displayOrder = existingCount + 1;

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new SlifeException(ErrorCode.FILE_TOO_LARGE);
            }
            String ext = getImageExtension(file.getOriginalFilename());
            String filename = listingId + "_" + System.currentTimeMillis() + "_" + displayOrder + ext;
            Path dir = uploadBasePath.resolve("listings");
            try {
                Files.createDirectories(dir);
                Path target = dir.resolve(filename).normalize();
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
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
}

