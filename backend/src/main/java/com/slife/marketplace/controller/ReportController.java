package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.ReportRequest;
import com.slife.marketplace.dto.request.ResolveReportRequest;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/api/admin/reports")
    public ResponseEntity<BaseResponse<List<ReportResponseDTO>>> getPendingReports() {
        List<ReportResponseDTO> reports = reportService.getPendingReports();
        return ResponseEntity.ok(BaseResponse.success("OK", reports));
    }

    @PutMapping("/api/admin/reports/{id}/resolve")
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request) {
        User admin = userService.getCurrentUser();
        ReportResponse response = reportService.resolveReport(id, admin, request);
        return ResponseEntity.ok(ApiResponse.success("Report resolved", response));
    }
}
