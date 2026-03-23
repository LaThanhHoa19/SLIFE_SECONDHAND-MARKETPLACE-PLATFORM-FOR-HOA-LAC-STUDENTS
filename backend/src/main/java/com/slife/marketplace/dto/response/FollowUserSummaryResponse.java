package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Minimal user info for follower / following lists (JPQL constructor expression).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowUserSummaryResponse {

    private Long id;
    private String fullName;
    private String avatarUrl;
    private BigDecimal reputationScore;
}
