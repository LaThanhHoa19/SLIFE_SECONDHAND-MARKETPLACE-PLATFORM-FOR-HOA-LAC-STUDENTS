package com.slife.marketplace.dto.response;

public record ConfigValidationMetaDTO(
        String type,
        Integer min,
        Integer max,
        String hint) {
}
