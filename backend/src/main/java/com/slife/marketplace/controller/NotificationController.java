package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.entity.Notification;
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
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", notificationService.getNotifications(user.getId())));
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", notificationService.getUnreadCount(user.getId())));
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PutMapping("/api/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        User user = userService.getCurrentUser();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
