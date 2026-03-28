package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.UserResponseDTO;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Page<UserResponseDTO> getUsers(int page, int size, String sortBy, String sortDir) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0 ? 20 : Math.min(size, 100);
        Sort sort = buildUserListSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, sort);

        return userRepository.findByRole("USER", pageable)
                .map(this::toUserResponseDTO);
    }

    private static Sort buildUserListSort(String sortBy, String sortDir) {
        String raw = trimOrEmpty(sortBy);
        if (raw.isEmpty() || "none".equalsIgnoreCase(raw) || "default".equalsIgnoreCase(raw)) {
            return Sort.by(Sort.Direction.ASC, "id");
        }
        if ("id".equalsIgnoreCase(raw)) {
            Sort.Direction direction = "asc".equalsIgnoreCase(trimOrEmpty(sortDir))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            return Sort.by(direction, "id");
        }
        String property = resolveAdminUserSortProperty(sortBy);
        Sort.Direction direction = "asc".equalsIgnoreCase(trimOrEmpty(sortDir))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }

    /** Chỉ cho phép sort theo field entity User — tránh sort property lạ từ client. */
    private static String resolveAdminUserSortProperty(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "createdAt";
        }
        return switch (sortBy.trim()) {
            case "reputationScore", "violationCount", "createdAt" -> sortBy.trim();
            default -> "createdAt";
        };
    }

    private static String trimOrEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    @Transactional
    public String updateUserStatus(Long id, String status) {
        String normalizedStatus = normalizeStatus(status);
        User user = userRepository.findByIdAndRole(id, "USER")
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        user.setStatus(normalizedStatus);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        if ("BANNED".equals(normalizedStatus)) {
            log.warn("Admin locked user account. userId={}, email={}", user.getId(), user.getEmail());
        }

        return "User status updated successfully";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "status is required");
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"BANNED".equals(normalized)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "status must be ACTIVE or BANNED");
        }
        return normalized;
    }

    private UserResponseDTO toUserResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getStatus(),
                user.getRole(),
                user.getReputationScore(),
                user.getViolationCount(),
                user.getCreatedAt());
    }
}
