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

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXT = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private final UserRepository userRepository;
    private final UserFileStorageService userFileStorage;

    public UserService(UserRepository userRepository, UserFileStorageService userFileStorage) {
        this.userRepository = userRepository;
        this.userFileStorage = userFileStorage;
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

    /**
     * Lưu số điện thoại (E.164 từ Firebase) và {@code phone_verified_at} sau khi OTP Firebase thành công.
     */
    @Transactional
    public User markPhoneVerifiedWithFirebase(String phoneNumberE164) {
        User user = getCurrentUser();
        assertPhoneNotUsedByAnotherAccount(user.getId(), phoneNumberE164);
        user.setPhoneNumber(phoneNumberE164);
        user.setPhoneVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.saveAndFlush(user);
        User reloaded = userRepository.findById(saved.getId())
                .orElseThrow(() -> new SlifeException(ErrorCode.INTERNAL_ERROR, "Failed to reload user after phone verification"));
        log.info("markPhoneVerifiedWithFirebase: userId={}, phoneNumber={}, phoneVerifiedAt={}",
                reloaded.getId(), reloaded.getPhoneNumber(), reloaded.getPhoneVerifiedAt());
        return reloaded;
    }

    /**
     * Gọi trước khi gửi OTP Firebase để tránh tốn SMS khi SĐT đã xác minh trên tài khoản khác.
     */
    public void assertPhoneAvailableForVerification(String phoneNumberRaw) {
        User user = getCurrentUser();
        if (phoneNumberRaw == null || phoneNumberRaw.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Số điện thoại là bắt buộc");
        }
        assertPhoneNotUsedByAnotherAccount(user.getId(), phoneNumberRaw.trim());
        log.info("assertPhoneAvailableForVerification: ok userId={}, phone={}", user.getId(), phoneNumberRaw.trim());
    }

    /**
     * Không cho hai tài khoản khác nhau cùng một SĐT (so khớp +84 / 0xx như {@link #sameVietnamMobileNumber}).
     */
    private void assertPhoneNotUsedByAnotherAccount(Long currentUserId, String phoneE164) {
        if (phoneE164 == null || phoneE164.isBlank()) {
            return;
        }
        List<User> others = userRepository.findByIdNotAndPhoneNumberIsNotNull(currentUserId);
        for (User other : others) {
            if (other.getPhoneNumber() != null && sameVietnamMobileNumber(other.getPhoneNumber(), phoneE164)) {
                throw new SlifeException(ErrorCode.PHONE_ALREADY_IN_USE,
                        "Số điện thoại này đã được xác minh trên tài khoản khác.");
            }
        }
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
            String normalizedPhone = request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim();
            // Firebase lưu E.164 (+84...); form có thể gửi 090... — cùng thuê bao không được coi là "đổi số".
            boolean changed = (user.getPhoneNumber() == null && normalizedPhone != null)
                    || (user.getPhoneNumber() != null && normalizedPhone == null)
                    || (user.getPhoneNumber() != null && normalizedPhone != null
                            && !sameVietnamMobileNumber(user.getPhoneNumber(), normalizedPhone));
            user.setPhoneNumber(normalizedPhone);
            if (changed) {
                user.setPhoneVerifiedAt(null);
            }
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim().isEmpty() ? null : request.getBio().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }
        if (request.getCoverImageUrl() != null) {
            user.setCoverImageUrl(
                    request.getCoverImageUrl().trim().isEmpty() ? null : request.getCoverImageUrl().trim());
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
        try {
            String url = userFileStorage.storeMultipart(file, subDir + "/" + filename);
            user.setAvatarUrl(url);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
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
        try {
            String url = userFileStorage.storeMultipart(file, subDir + "/" + filename);
            user.setCoverImageUrl(url);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            log.error("uploadCover failed: {}", e.getMessage(), e);
            throw new SlifeException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }
    }

    /**
     * Hai chuỗi SĐT VN coi là một nếu cùng thuê bao (chuẩn hoá về 9 chữ số quốc nội).
     * Tránh trường hợp E.164 (+84...) vs 0xx chỉ khác định dạng nhưng {@link #vietnamMobileNationalDigits}
     * trả null (độ dài lệch) → gây xóa nhầm {@code phone_verified_at}.
     */
    private static boolean sameVietnamMobileNumber(String a, String b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        String ka = vietnamMobileKey9(a);
        String kb = vietnamMobileKey9(b);
        if (ka != null && kb != null) {
            return ka.equals(kb);
        }
        return a.trim().equals(b.trim());
    }

    /**
     * Khóa so sánh: 9 chữ số thuê bao (vd 349544953). Bỏ qua +, 84, 0 đầu; lấy 9 số cuối nếu chuỗi dài hơn.
     */
    private static String vietnamMobileKey9(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = raw.trim().replaceAll("\\s+", "").replaceFirst("^\\+", "").replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        if (digits.startsWith("84")) {
            digits = digits.substring(2);
        }
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (digits.length() < 9) {
            return null;
        }
        return digits.substring(digits.length() - 9);
    }

    private static String getImageExtension(String filename) {
        if (filename == null || filename.isBlank())
            return ".jpg";
        int i = filename.lastIndexOf('.');
        if (i <= 0)
            return ".jpg";
        String ext = filename.substring(i).toLowerCase();
        for (String e : ALLOWED_EXT) {
            if (ext.equals(e))
                return ext;
        }
        return ".jpg";
    }
}
