package com.slife.marketplace.dto.response;

import com.slife.marketplace.entity.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Public user profile for API responses, including follow metadata.
 */
@Data
public class UserProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private Boolean phoneVerified;
    private LocalDateTime phoneVerifiedAt;
    private String avatarUrl;
    private String coverImageUrl;
    private String bio;
    private String role;
    private String status;
    private BigDecimal reputationScore;
    private Integer violationCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    /** Number of users following this profile. */
    private long followerCount;

    /** How many users this profile is following. */
    private long followingCount;

    /** Total number of ACTIVE listings by this user. SCRUM-216 */
    private long listingCount;

    /**
     * Whether the authenticated viewer follows this user.
     * Null when viewing own profile or when viewer is unknown.
     */
    private Boolean isFollowedByViewer;

    /** True if authenticated viewer blocked this user. */
    private Boolean isBlockedByViewer;

    /** True if this user blocked the authenticated viewer. */
    private Boolean hasBlockedViewer;

    public static UserProfileResponse fromUser(User user) {
        UserProfileResponse r = new UserProfileResponse();
        if (user == null) {
            return r;
        }
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setFullName(user.getFullName());
        r.setPhoneNumber(user.getPhoneNumber());
        r.setPhoneVerifiedAt(user.getPhoneVerifiedAt());
        r.setPhoneVerified(user.getPhoneVerifiedAt() != null);
        r.setAvatarUrl(user.getAvatarUrl());
        r.setCoverImageUrl(user.getCoverImageUrl());
        r.setBio(user.getBio());
        r.setRole(user.getRole());
        r.setStatus(user.getStatus());
        r.setReputationScore(user.getReputationScore());
        r.setViolationCount(user.getViolationCount());
        r.setCreatedAt(user.getCreatedAt());
        r.setUpdatedAt(user.getUpdatedAt());
        r.setDeletedAt(user.getDeletedAt());
        return r;
    }
}
