package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotBlank(message = "status is required (RESOLVED / DISMISSED)")
    private String status;

    private String adminNote;
}
