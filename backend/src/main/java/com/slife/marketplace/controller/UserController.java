package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.UpdateUserRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        log.info("GET /api/users/me - start");
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            log.info("GET /api/users/me - auth present={}, authenticated={}, principal type={}",
                    auth != null,
                    auth != null && auth.isAuthenticated(),
                    auth != null && auth.getPrincipal() != null ? auth.getPrincipal().getClass().getName() : "null");
            User user = userService.getCurrentUser();
            log.info("GET /api/users/me - success, userId={}, email={}", user.getId(), user.getEmail());
            return ResponseEntity.ok(ApiResponse.success("OK", user));
        } catch (Exception e) {
            log.error("GET /api/users/me - error: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/api/users/me")
    public ResponseEntity<ApiResponse<User>> updateCurrentUser(@RequestBody(required = false) UpdateUserRequest request) {
        log.info("PUT /api/users/me - start, request null={}", request == null);
        try {
            if (request != null) {
                log.debug("PUT /api/users/me - body: fullName={}, phoneNumber length={}, bio length={}",
                        request.getFullName(),
                        request.getPhoneNumber() != null ? request.getPhoneNumber().length() : 0,
                        request.getBio() != null ? request.getBio().length() : 0);
            }
            User user = userService.updateCurrentUser(request != null ? request : new UpdateUserRequest());
            log.info("PUT /api/users/me - success, userId={}", user.getId());
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", user));
        } catch (Exception e) {
            log.error("PUT /api/users/me - error: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping(value = "/api/users/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<User>> uploadAvatar(@RequestParam(value = "file", required = false) MultipartFile file) {
        log.info("POST /api/users/me/avatar - file present={}, size={}", file != null && !file.isEmpty(), file != null ? file.getSize() : 0);
        User user = userService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật avatar thành công", user));
    }

    @PostMapping(value = "/api/users/me/cover", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<User>> uploadCover(@RequestParam(value = "file", required = false) MultipartFile file) {
        log.info("POST /api/users/me/cover - file present={}, size={}", file != null && !file.isEmpty(), file != null ? file.getSize() : 0);
        User user = userService.uploadCover(file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh bìa thành công", user));
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        log.info("GET /api/users/{} - start", id);
        try {
            User user = userService.getUserById(id);
            log.info("GET /api/users/{} - success", id);
            return ResponseEntity.ok(ApiResponse.success("OK", user));
        } catch (Exception e) {
            log.error("GET /api/users/{} - error: {}", id, e.getMessage(), e);
            throw e;
        }
    }
}
