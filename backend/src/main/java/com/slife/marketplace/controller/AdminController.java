package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.AdminUpdateUserStatusRequest;
import com.slife.marketplace.dto.response.AdminDashboardStatsResponse;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.dto.response.UserResponseDTO;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.AdminService;
import com.slife.marketplace.service.UserService;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    public AdminController(AdminService adminService, UserService userService) {
        this.adminService = adminService;
        this.userService = userService;
    }

    @GetMapping("/api/admin/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboard() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/api/admin/users")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String status) {
        Page<UserResponseDTO> users = adminService.getUsers(page, size, sortBy, sortDir, status);
        return ResponseEntity.ok(ApiResponse.success("OK", users));
    }

    @PatchMapping("/api/admin/users/{id}/status")
    public ResponseEntity<BaseResponse<String>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserStatusRequest request) {
        User admin = userService.getCurrentUser();
        String message = adminService.updateUserStatus(id, request.status(), admin);
        return ResponseEntity.ok(BaseResponse.success(message, message));
    }
}
