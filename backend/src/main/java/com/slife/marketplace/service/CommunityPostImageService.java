package com.slife.marketplace.service;

import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostImageRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.util.Constants;
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

/**
 * Upload/xóa ảnh bài cộng đồng — cùng quy tắc kích thước/giới hạn số ảnh như {@link ListingImageService}.
 */
@Service
public class CommunityPostImageService {

    private static final Logger log = LoggerFactory.getLogger(CommunityPostImageService.class);
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final int DEFAULT_MAX_IMAGES_PER_POST = 10;
    private static final String[] ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"};

    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostImageRepository communityPostImageRepository;
    private final ConfigService configService;
    private final Path uploadBasePath;

    public CommunityPostImageService(CommunityPostRepository communityPostRepository,
                                     CommunityPostImageRepository communityPostImageRepository,
                                     ConfigService configService,
                                     Path uploadBasePath) {
        this.communityPostRepository = communityPostRepository;
        this.communityPostImageRepository = communityPostImageRepository;
        this.configService = configService;
        this.uploadBasePath = uploadBasePath;
    }

    @Transactional
    public void uploadPostImages(Long postId, List<MultipartFile> files, User currentUser) {
        if (files == null || files.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "No images uploaded");
        }
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (currentUser == null || post.getAuthor() == null || !post.getAuthor().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }

        int existingCount = communityPostImageRepository.countByPost_Id(postId);
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
            String filename = postId + "_" + System.currentTimeMillis() + "_" + displayOrder + ext;
            Path dir = uploadBasePath.resolve("community-posts");
            try {
                Files.createDirectories(dir);
                Path target = dir.resolve(filename).normalize();
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                log.error("uploadPostImages failed postId={}", postId, e);
                throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
            }

            String url = "/uploads/community-posts/" + filename;

            CommunityPostImage image = new CommunityPostImage();
            image.setPost(post);
            image.setImageUrl(url);
            image.setDisplayOrder(displayOrder++);
            image.setCreatedAt(Instant.now());
            communityPostImageRepository.save(image);
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

    @Transactional
    public void deletePostImage(Long postId, Long imageId, User currentUser) {
        if (currentUser == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (post.getAuthor() == null || !post.getAuthor().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        CommunityPostImage img = communityPostImageRepository.findById(imageId)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Image not found"));
        if (!img.getPost().getId().equals(postId)) {
            throw new SlifeException(ErrorCode.FORBIDDEN);
        }
        deleteStoredFileIfSafe(img.getImageUrl());
        communityPostImageRepository.delete(img);
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
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete community post image file: {}", imageUrl, e);
        }
    }
}
