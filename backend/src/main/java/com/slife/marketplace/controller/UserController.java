package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.request.UpdateUserRequest;
import com.slife.marketplace.dto.request.VerifyPhoneRequest;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.service.PhoneVerificationService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PhoneVerificationService phoneVerificationService;

    public UserController(
            UserRepository userRepository,
            UserService userService,
            PhoneVerificationService phoneVerificationService
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.phoneVerificationService = phoneVerificationService;
    }

    @GetMapping("/api/users/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("Success", user));
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("Success", user));
    }

    @GetMapping("/api/users")
    public ResponseEntity<?> listUsers() {
        return ResponseEntity.ok(ApiResponse.success("Success", userRepository.findAll()));
    }

    @PutMapping("/api/users/me")
    public ResponseEntity<ApiResponse<User>> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        User saved = userService.updateCurrentUser(request);
        return ResponseEntity.ok(ApiResponse.success("Success", saved));
    }

    @PostMapping("/api/users/me/avatar")
    public ResponseEntity<ApiResponse<User>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Success", userService.uploadAvatar(file)));
    }

    @PostMapping("/api/users/me/cover")
    public ResponseEntity<ApiResponse<User>> uploadCover(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Success", userService.uploadCover(file)));
    }

    @PostMapping("/api/users/me/phone/verify")
    public ResponseEntity<ApiResponse<User>> verifyPhone(@Valid @RequestBody VerifyPhoneRequest request) {
        User saved = phoneVerificationService.verifyAndSetPhone(request);
        return ResponseEntity.ok(ApiResponse.success("Success", saved));
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id, @RequestParam boolean blocked) {
        return ResponseEntity.ok().build();
    }
}
