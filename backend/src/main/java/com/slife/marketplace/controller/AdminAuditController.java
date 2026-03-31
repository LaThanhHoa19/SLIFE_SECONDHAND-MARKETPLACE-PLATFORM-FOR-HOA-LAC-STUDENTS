package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.AuditLogEntryDTO;
import com.slife.marketplace.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditLogService auditLogService;

    public AdminAuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/api/admin/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogEntryDTO>>> listAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action) {
        Page<AuditLogEntryDTO> logs = auditLogService.list(page, size, action);
        return ResponseEntity.ok(ApiResponse.success("OK", logs));
    }
}
