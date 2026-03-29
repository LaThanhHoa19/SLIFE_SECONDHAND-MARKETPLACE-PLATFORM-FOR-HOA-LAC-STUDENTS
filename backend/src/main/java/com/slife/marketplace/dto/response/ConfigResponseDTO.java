package com.slife.marketplace.dto.response;

import java.time.Instant;

public record ConfigResponseDTO(
        Long id,
        String configKey,
        String configValue,
        String description,
        Instant lastUpdated) {
}
