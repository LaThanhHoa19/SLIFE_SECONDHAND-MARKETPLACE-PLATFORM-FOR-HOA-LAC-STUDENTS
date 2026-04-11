package com.slife.marketplace.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Minimal user info for follower / following lists (JPQL constructor expression).
 * {@code blockedAt} chỉ có trên danh sách chặn; null khi theo dõi.
 */
@Data
@NoArgsConstructor
public class FollowUserSummaryResponse {

    private Long id;
    private String fullName;
    private String avatarUrl;
    private BigDecimal reputationScore;
    private Instant blockedAt;

    public FollowUserSummaryResponse(Long id, String fullName, String avatarUrl, BigDecimal reputationScore) {
        this(id, fullName, avatarUrl, reputationScore, null);
    }

    public FollowUserSummaryResponse(Long id, String fullName, String avatarUrl, BigDecimal reputationScore,
                                     Instant blockedAt) {
        this.id = id;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.reputationScore = reputationScore;
        this.blockedAt = blockedAt;
    }
}
