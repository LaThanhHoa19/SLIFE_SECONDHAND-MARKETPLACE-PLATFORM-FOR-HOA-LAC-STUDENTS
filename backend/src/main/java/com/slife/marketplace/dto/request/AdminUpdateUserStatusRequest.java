package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminUpdateUserStatusRequest(
        @NotBlank(message = "status is required")
        String status) {
}
