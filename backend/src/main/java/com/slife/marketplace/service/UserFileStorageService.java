package com.slife.marketplace.service;

import com.slife.marketplace.config.StorageProperties;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

/**
 * Lưu file upload: đĩa cục bộ ({@code /uploads/...}) hoặc S3 (URL HTTPS đầy đủ).
 * Khi {@code app.storage.mode=s3}, cần biến môi trường {@code AWS_ACCESS_KEY_ID} / {@code AWS_SECRET_ACCESS_KEY}
 * (hoặc IAM role trên EC2) và {@code app.storage.s3.bucket}.
 */
@Service
public class UserFileStorageService {

    private static final Logger log = LoggerFactory.getLogger(UserFileStorageService.class);

    private final StorageProperties properties;
    private final Path uploadBasePath;
    private final S3Client s3Client;

    public UserFileStorageService(StorageProperties properties,
                                  Path uploadBasePath,
                                  ObjectProvider<S3Client> s3ClientProvider) {
        this.properties = properties;
        this.uploadBasePath = uploadBasePath;
        this.s3Client = s3ClientProvider.getIfAvailable();
    }

    @PostConstruct
    void validate() {
        if (isS3()) {
            if (s3Client == null) {
                throw new IllegalStateException("app.storage.mode=s3 nhưng S3Client không khả dụng.");
            }
            String b = properties.getS3().getBucket();
            if (b == null || b.isBlank()) {
                throw new IllegalStateException("app.storage.mode=s3 yêu cầu app.storage.s3.bucket (hoặc AWS_S3_BUCKET).");
            }
        }
    }

    private boolean isS3() {
        String m = properties.getMode();
        return m != null && "s3".equalsIgnoreCase(m.trim());
    }

    /**
     * @param relativePath ví dụ {@code listings/1_a.jpg} (không có tiền tố /uploads/)
     * @return {@code /uploads/...} khi local, hoặc URL https khi S3
     */
    public String storeMultipart(MultipartFile file, String relativePath) {
        Objects.requireNonNull(relativePath, "relativePath");
        String normalized = normalizeRelative(relativePath);
        try (InputStream in = file.getInputStream()) {
            return storeStream(in, file.getSize(), file.getContentType(), normalized);
        } catch (IOException e) {
            log.error("storeMultipart failed", e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * @param relativePath cùng quy ước {@link #storeMultipart}
     */
    public String storeStream(InputStream in, long size, String contentType, String relativePath) {
        String normalized = normalizeRelative(relativePath);
        if (isS3()) {
            String key = buildObjectKey(normalized);
            String ct = contentType != null && !contentType.isBlank() ? contentType : "application/octet-stream";
            try {
                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(properties.getS3().getBucket())
                                .key(key)
                                .contentType(ct)
                                .build(),
                        RequestBody.fromInputStream(in, size));
            } catch (Exception e) {
                log.error("S3 put failed key={}", key, e);
                throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
            }
            return publicUrlForKey(key);
        }
        Path base = uploadBasePath.toAbsolutePath().normalize();
        Path target = base.resolve(normalized).normalize();
        if (!target.startsWith(base)) {
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, "path traversal");
        }
        try {
            Files.createDirectories(target.getParent());
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("local store failed {}", normalized, e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        return "/uploads/" + normalized;
    }

    private static String normalizeRelative(String relativePath) {
        String n = relativePath.replace('\\', '/').replaceAll("^/+", "");
        if (n.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "empty path");
        }
        return n;
    }

    private String buildObjectKey(String normalizedRelativePath) {
        String prefix = properties.getS3().getKeyPrefix();
        if (prefix == null || prefix.isBlank()) {
            return normalizedRelativePath;
        }
        String p = prefix.replaceAll("^/+", "").replaceAll("/+$", "");
        return p + "/" + normalizedRelativePath;
    }

    private String publicUrlForKey(String key) {
        String override = properties.getS3().getPublicBaseUrl();
        if (override != null && !override.isBlank()) {
            String base = override.replaceAll("/+$", "");
            String k = key.startsWith("/") ? key.substring(1) : key;
            return base + "/" + k;
        }
        String bucket = properties.getS3().getBucket();
        String region = properties.getS3().getRegion();
        if (region == null || region.isBlank()) {
            region = "ap-southeast-1";
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    /**
     * Xóa file local hoặc object S3 theo giá trị đã lưu trong DB.
     */
    public void deleteStoredIfExists(String storedReference) {
        if (storedReference == null || storedReference.isBlank()) {
            return;
        }
        String ref = storedReference.trim();
        if (ref.startsWith("http://") || ref.startsWith("https://")) {
            if (!isS3() || s3Client == null) {
                return;
            }
            String key = extractS3KeyFromPublicUrl(ref);
            if (key == null || key.isBlank()) {
                log.warn("Could not extract S3 key from URL: {}", ref);
                return;
            }
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(properties.getS3().getBucket())
                        .key(key)
                        .build());
            } catch (Exception e) {
                log.warn("S3 delete failed key={}", key, e);
            }
            return;
        }
        if (!ref.startsWith("/uploads/")) {
            return;
        }
        String relative = ref.substring("/uploads/".length());
        try {
            Path base = uploadBasePath.toAbsolutePath().normalize();
            Path target = base.resolve(relative).normalize();
            if (!target.startsWith(base)) {
                log.warn("Refusing to delete outside upload dir: {}", ref);
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete local file: {}", ref, e);
        }
    }

    private String extractS3KeyFromPublicUrl(String url) {
        try {
            URI u = URI.create(url);
            String path = u.getPath();
            if (path == null || path.isEmpty()) {
                return null;
            }
            String raw = path.startsWith("/") ? path.substring(1) : path;
            return java.net.URLDecoder.decode(raw, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
