package com.slife.marketplace.dto.response;

import java.time.Instant;

public record ReportResponseDTO(
        Long reportId,
        String reporterName,
        String targetType,
        Long targetId,
        String targetPreview,
        Long listingId,
        Long conversationId,
        String reason,
        String status,
        String adminNote,
        Instant createdAt) {
}
