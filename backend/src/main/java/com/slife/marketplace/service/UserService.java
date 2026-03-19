package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.UpdateUserRequest;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXT = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private final UserRepository userRepository;
    private final Path uploadBasePath;

    public UserService(UserRepository userRepository, Path uploadBasePath) {
        this.userRepository = userRepository;
        this.uploadBasePath = uploadBasePath;
        log.info("UserService upload base path: {}", this.uploadBasePath);
    }

    public User getCurrentUser() {
        log.debug("getCurrentUser - start");
        String email = getCurrentUserEmail();
        log.debug("getCurrentUser - email from auth: {}", email != null ? email : "null");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("getCurrentUser - user not found for email: {}", email);
                    return new SlifeException(ErrorCode.UNAUTHORIZED, "Session invalid. Please login again.");
                });
        log.debug("getCurrentUser - found userId={}", user.getId());
        return user;
    }

    /** Trả về user hiện tại nếu đã đăng nhập, Optional.empty() nếu chưa. */
    public java.util.Optional<User> getCurrentUserOptional() {
        try {
            return java.util.Optional.of(getCurrentUser());
        } catch (Exception e) {
            return java.util.Optional.empty();
        }
    }

    public String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.debug("getCurrentUserEmail - auth null={}, authenticated={}, principal null={}",
                auth == null, auth != null && auth.isAuthenticated(),
                auth != null && auth.getPrincipal() == null);
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            log.warn("getCurrentUserEmail - unauthorized: auth or principal missing");
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        Object principal = auth.getPrincipal();
        String email = null;
        if (principal instanceof String) {
            email = (String) principal;
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        }
        if (email == null || email.isBlank()) {
            log.warn("getCurrentUserEmail - principal type not supported: {}", principal.getClass().getName());
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        log.debug("getCurrentUserEmail - resolved email: {}", email);
        return email;
    }

    public User getUserById(Long id) {
        log.debug("getUserById - id={}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public User updateCurrentUser(UpdateUserRequest request) {
        log.debug("updateCurrentUser - start");
        if (request == null) {
            request = new UpdateUserRequest();
        }
        User user = getCurrentUser();
        log.debug("updateCurrentUser - loaded user id={}, fullName={}", user.getId(), user.getFullName());
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(user.getEmail() != null ? user.getEmail() : "User");
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim().isEmpty() ? null : request.getBio().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }
        if (request.getCoverImageUrl() != null) {
            user.setCoverImageUrl(request.getCoverImageUrl().trim().isEmpty() ? null : request.getCoverImageUrl().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        log.debug("updateCurrentUser - before save, fullName={}", user.getFullName());
        try {
            User saved = userRepository.save(user);
            log.debug("updateCurrentUser - save ok, id={}", saved.getId());
            return saved;
        } catch (Exception e) {
            log.error("updateCurrentUser - save failed: {} - {}", e.getClass().getName(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public User uploadAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        String ext = getImageExtension(file.getOriginalFilename());
        User user = getCurrentUser();
        String subDir = "avatars";
        String filename = user.getId() + "_" + System.currentTimeMillis() + ext;
        Path dir = uploadBasePath.resolve(subDir);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String url = "/uploads/" + subDir + "/" + filename;
            user.setAvatarUrl(url);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } catch (IOException e) {
            log.error("uploadAvatar failed: {}", e.getMessage(), e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }
    }

    @Transactional
    public User uploadCover(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        String ext = getImageExtension(file.getOriginalFilename());
        User user = getCurrentUser();
        String subDir = "covers";
        String filename = user.getId() + "_" + System.currentTimeMillis() + ext;
        Path dir = uploadBasePath.resolve(subDir);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String url = "/uploads/" + subDir + "/" + filename;
            user.setCoverImageUrl(url);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } catch (IOException e) {
            log.error("uploadCover failed: {}", e.getMessage(), e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
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
