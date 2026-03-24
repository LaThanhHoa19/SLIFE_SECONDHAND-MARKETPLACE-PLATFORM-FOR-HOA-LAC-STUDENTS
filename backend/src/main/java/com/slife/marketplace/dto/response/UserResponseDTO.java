package com.slife.marketplace.dto.response;

import java.math.BigDecimal;

public record UserResponseDTO(
        Long id,
        String fullName,
        String email,
        String status,
        String role,
        BigDecimal reputationScore) {
}
