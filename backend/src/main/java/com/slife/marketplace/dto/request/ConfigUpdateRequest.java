package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ConfigUpdateRequest(
        @NotBlank(message = "key is required")
        String key,
        @NotBlank(message = "value is required")
        String value) {
}
