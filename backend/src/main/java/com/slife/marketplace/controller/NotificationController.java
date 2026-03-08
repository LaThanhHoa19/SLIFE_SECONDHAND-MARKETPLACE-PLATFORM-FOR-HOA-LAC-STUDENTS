/**
 * Mục đích: Controller Notification
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {

    @GetMapping("/api/notifications")
    public ResponseEntity<ApiResponse<List<Object>>> getNotifications() {
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}