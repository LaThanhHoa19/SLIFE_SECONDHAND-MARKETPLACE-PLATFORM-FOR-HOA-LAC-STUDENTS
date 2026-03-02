package com.slife.marketplace.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminUserSummaryResponse(
    Long id,
    String email,
    String fullName,
    String role,
    String status,
    BigDecimal reputationScore,
    LocalDateTime createdAt
) {
}
