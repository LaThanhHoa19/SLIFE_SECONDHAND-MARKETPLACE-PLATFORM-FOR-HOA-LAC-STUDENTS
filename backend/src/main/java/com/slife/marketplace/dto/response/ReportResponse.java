package com.slife.marketplace.dto.response;

import com.slife.marketplace.entity.Report;
import lombok.Data;

import java.time.Instant;

@Data
public class ReportResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String targetType;
    private Long targetId;
    private String reason;
    private String status;
    private String adminNote;
    private Long handledById;
    private String handledByName;
    private Instant createdAt;
    private Instant updatedAt;

    public static ReportResponse from(Report r) {
        ReportResponse dto = new ReportResponse();
        dto.setId(r.getId());
        dto.setTargetType(r.getTargetType());
        dto.setTargetId(r.getTargetId());
        dto.setReason(r.getReason());
        dto.setStatus(r.getStatus());
        dto.setAdminNote(r.getAdminNote());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());

        if (r.getReporter() != null) {
            dto.setReporterId(r.getReporter().getId());
            dto.setReporterName(r.getReporter().getFullName());
        }
        if (r.getHandledBy() != null) {
            dto.setHandledById(r.getHandledBy().getId());
            dto.setHandledByName(r.getHandledBy().getFullName());
        }
        return dto;
    }
}
