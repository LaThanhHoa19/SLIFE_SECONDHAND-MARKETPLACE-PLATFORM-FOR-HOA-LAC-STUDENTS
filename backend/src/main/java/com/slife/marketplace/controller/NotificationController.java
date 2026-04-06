package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.CursorPageResponse;
import com.slife.marketplace.dto.response.NotificationResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.NotificationService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping("/api/notifications")
    public ResponseEntity<ApiResponse<CursorPageResponse<NotificationResponse>>> getNotifications(
            @RequestParam(value = "limit", required = false, defaultValue = "30") int limit,
            @RequestParam(value = "cursor", required = false) String cursor
    ) {
        User user = userService.getCurrentUser();
        CursorPageResponse<NotificationResponse> page = notificationService.getNotificationResponsesPage(user.getId(), limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("OK", page));
    }

    @GetMapping("/api/notifications/search")
    public ResponseEntity<ApiResponse<CursorPageResponse<NotificationResponse>>> searchNotifications(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", required = false, defaultValue = "30") int limit,
            @RequestParam(value = "cursor", required = false) String cursor
    ) {
        User user = userService.getCurrentUser();
        CursorPageResponse<NotificationResponse> page = notificationService.searchNotificationResponsesPage(user.getId(), q, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("OK", page));
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", notificationService.getUnreadCount(user.getId())));
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        notificationService.markRead(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PatchMapping("/api/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        User user = userService.getCurrentUser();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
