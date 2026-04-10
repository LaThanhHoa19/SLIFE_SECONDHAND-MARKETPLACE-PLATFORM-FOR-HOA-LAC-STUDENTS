package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.AdminProcessReportRequest;
import com.slife.marketplace.dto.request.ReportRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.dto.response.ReportResponse;
import com.slife.marketplace.dto.response.ReportResponseDTO;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ReportService;
import com.slife.marketplace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    public ReportController(ReportService reportService, UserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    @PostMapping("/api/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(@Valid @RequestBody ReportRequest request) {
        User reporter = userService.getCurrentUser();
        ReportResponse response = reportService.createReport(reporter, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report submitted successfully", response));
    }

    @PostMapping(path = "/api/reports/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadReportImage(@RequestPart("file") MultipartFile file) {
        User reporter = userService.getCurrentUser();
        if (reporter == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Authentication required"));
        }
        String imageUrl = reportService.uploadReportEvidenceImage(file);
        return ResponseEntity.ok(ApiResponse.success("Upload success", Map.of("imageUrl", imageUrl)));
    }

    @GetMapping("/api/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<List<ReportResponseDTO>>> getPendingReports() {
        List<ReportResponseDTO> reports = reportService.getPendingReports();
        return ResponseEntity.ok(BaseResponse.success("OK", reports));
    }

    @GetMapping("/api/admin/reports/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<ReportResponseDTO>> getAdminReportById(@PathVariable Long id) {
        ReportResponseDTO dto = reportService.getAdminReportById(id);
        return ResponseEntity.ok(BaseResponse.success("OK", dto));
    }

    @GetMapping("/api/admin/reports/page")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<Page<ReportResponseDTO>>> getReportsPage(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Page<ReportResponseDTO> result = reportService.getAdminReports(targetType, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(BaseResponse.success("OK", result));
    }

    @PatchMapping("/api/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<String>> processReport(
            @PathVariable Long id,
            @Valid @RequestBody AdminProcessReportRequest request) {
        User admin = userService.getCurrentUser();
        String message = reportService.processReport(id, request.action(), request.note(), admin);
        return ResponseEntity.ok(BaseResponse.success(message, message));
    }

}
