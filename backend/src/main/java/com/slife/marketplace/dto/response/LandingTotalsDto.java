package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingTotalsDto {
    private long activeListings;
    private long registeredUsers;
    private long completedDeals;
    /** Trung bình reputation_score (user ACTIVE); null nếu không có bản ghi. */
    private BigDecimal averageReputation;
}
