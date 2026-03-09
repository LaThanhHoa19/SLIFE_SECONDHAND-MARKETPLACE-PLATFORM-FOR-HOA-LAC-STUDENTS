package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/api/auth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse authResponse = authService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    /**
     * Đăng nhập tài khoản test (Alice, Bob) để test giao diện khi chưa có 2 tk thật.
     * Email: alice@example.com, bob@example.com (user seed trong DB).
     */
    @GetMapping("/api/auth/test-login")
    public ResponseEntity<ApiResponse<AuthResponse>> testLogin(@RequestParam String email) {
        AuthResponse authResponse = authService.issueTokenForDev(email);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thử nghiệm thành công", authResponse));
    }

    /**
     * Khởi tạo môi trường test chat: tạo listing cho Alice + conversation giữa Bob và Alice.
     * Trả về { sessionId, listingId, aliceToken, bobToken, aliceId, bobId }.
     * Gọi endpoint này một lần trước khi test, sau đó dùng token để đăng nhập từng tab.
     */
    @GetMapping("/api/auth/test-chat-init")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testChatInit() {
        Map<String, Object> result = authService.setupTestChat();
        return ResponseEntity.ok(ApiResponse.success("Test chat environment ready", result));
    }
}
