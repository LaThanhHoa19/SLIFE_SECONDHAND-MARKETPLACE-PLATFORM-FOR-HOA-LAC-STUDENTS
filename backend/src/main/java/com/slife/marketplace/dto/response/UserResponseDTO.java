package com.slife.marketplace.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserResponseDTO(
        Long id,
        String fullName,
        String email,
        String avatarUrl,
        String status,
        String role,
        BigDecimal reputationScore,
        Integer violationCount,
        LocalDateTime createdAt) {
}
