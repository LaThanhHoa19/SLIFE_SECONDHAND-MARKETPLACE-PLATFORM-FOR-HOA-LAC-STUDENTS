package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminProcessReportRequest(
        @NotBlank(message = "action is required")
        String action,
        String note) {
}
