package com.slife.marketplace.dto.response;

import java.time.Instant;

public record ConfigResponseDTO(
        String configKey,
        String configValue,
        String description,
        Instant lastUpdated) {
}
