package com.slife.marketplace.dto.response;

import java.time.Instant;

public record ReportResponseDTO(
        Long reportId,
        String reporterName,
        String targetType,
        String reason,
        Instant createdAt) {
}
