package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.NotificationResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.NotificationService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping("/api/notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications() {
        User user = userService.getCurrentUser();
        List<NotificationResponse> list = notificationService.getNotifications(user.getId())
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success("OK", list));
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", notificationService.getUnreadCount(user.getId())));
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PatchMapping("/api/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        User user = userService.getCurrentUser();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
