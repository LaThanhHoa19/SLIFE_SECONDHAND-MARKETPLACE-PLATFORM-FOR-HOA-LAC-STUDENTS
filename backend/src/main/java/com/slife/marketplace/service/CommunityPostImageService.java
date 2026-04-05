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

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PushbackInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Upload/xóa ảnh bài cộng đồng — chỉ JPG/PNG, tối đa 5MB/file; số ảnh/bài theo config (giống tin đăng).
 */
@Service
public class CommunityPostImageService {

    private static final Logger log = LoggerFactory.getLogger(CommunityPostImageService.class);
    public static final int MAX_IMAGE_MB = 5;
    private static final long MAX_IMAGE_SIZE = MAX_IMAGE_MB * 1024L * 1024L;
    private static final int DEFAULT_MAX_IMAGES_PER_POST = 10;
    private static final String[] ALLOWED_EXT = {".jpg", ".jpeg", ".png"};
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/pjpeg", "image/png");

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
            validateCommunityImageFilename(file.getOriginalFilename());
            String rawCt = file.getContentType();
            if (rawCt == null || !ALLOWED_CONTENT_TYPES.contains(rawCt.trim().toLowerCase(Locale.ROOT))) {
                throw new SlifeException(ErrorCode.INVALID_FILE_TYPE, "Chỉ chấp nhận JPG hoặc PNG");
            }

            String baseName = postId + "_" + System.currentTimeMillis() + "_" + displayOrder;
            Path dir = uploadBasePath.resolve("community-posts");
            String storedFilename;
            try {
                Files.createDirectories(dir);
                try (InputStream raw = file.getInputStream();
                     PushbackInputStream in = new PushbackInputStream(new BufferedInputStream(raw), 16)) {
                    byte[] head = new byte[12];
                    int n = in.read(head);
                    if (n < 2) {
                        throw new SlifeException(ErrorCode.INVALID_FILE_TYPE, "File ảnh không hợp lệ hoặc trống");
                    }
                    in.unread(head, 0, n);
                    boolean jpeg = isJpegMagic(head, n);
                    boolean png = isPngMagic(head, n);
                    if (!jpeg && !png) {
                        throw new SlifeException(ErrorCode.INVALID_FILE_TYPE, "Nội dung không phải JPG hoặc PNG");
                    }
                    String ext = jpeg ? ".jpg" : ".png";
                    storedFilename = baseName + ext;
                    Path target = dir.resolve(storedFilename).normalize();
                    Path base = dir.toAbsolutePath().normalize();
                    if (!target.startsWith(base)) {
                        throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
                    }
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                log.error("uploadPostImages failed postId={}", postId, e);
                throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
            }

            String url = "/uploads/community-posts/" + storedFilename;

            CommunityPostImage image = new CommunityPostImage();
            image.setPost(post);
            image.setImageUrl(url);
            image.setDisplayOrder(displayOrder++);
            image.setCreatedAt(Instant.now());
            communityPostImageRepository.save(image);
        }
    }

    private void validateCommunityImageFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_FILE_TYPE, "Thiếu tên file hoặc phần mở rộng không hợp lệ");
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        for (String ext : ALLOWED_EXT) {
            if (lower.endsWith(ext)) {
                return;
            }
        }
        throw new SlifeException(ErrorCode.INVALID_FILE_TYPE, "Chỉ chấp nhận ảnh .jpg, .jpeg, .png");
    }

    /** SOI JPEG: FF D8 (byte tiếp theo là marker khác, không nhất thiết FF). */
    private static boolean isJpegMagic(byte[] head, int n) {
        return n >= 2 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8;
    }

    private static boolean isPngMagic(byte[] head, int n) {
        return n >= 4
                && (head[0] & 0xFF) == 0x89
                && head[1] == 0x50
                && head[2] == 0x4E
                && head[3] == 0x47;
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
