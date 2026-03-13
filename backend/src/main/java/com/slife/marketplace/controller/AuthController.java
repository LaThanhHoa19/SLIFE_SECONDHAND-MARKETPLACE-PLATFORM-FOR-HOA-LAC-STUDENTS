package com.slife.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.request.AuthRequest;
import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.security.TokenBlacklistService;
import com.slife.marketplace.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final TokenBlacklistService tokenBlacklistService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService,
                          ObjectMapper objectMapper,
                          TokenBlacklistService tokenBlacklistService) {
        this.authService = authService;
        this.objectMapper = objectMapper;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    /** DEV ONLY */
    @PostMapping("/dev-login")
    public ResponseEntity<ApiResponse<AuthResponse>> devLogin(@RequestParam("email") String email) {
        return ResponseEntity.ok(ApiResponse.success("Dev login successful", authService.devLogin(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    /**
     * POST /api/auth/logout
     * Blacklist access token hien tai de thu hoi quyen truy cap ngay lap tuc.
     * Client gui: Authorization: Bearer <token>
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String bearer = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            tokenBlacklistService.blacklist(bearer.substring(7));
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Google login successful", authService.googleLogin(request)));
    }

    @GetMapping("/google/init")
    public void googleInit(HttpServletResponse response) throws IOException {
        response.sendRedirect(authService.getGoogleAuthorizationUrl());
    }

    @GetMapping("/google/callback")
    public void googleCallbackRedirect(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            HttpServletResponse response) throws IOException {

        if (error != null || code == null) {
            String msg = error != null ? error : "Authentication was cancelled";
            response.sendRedirect(frontendUrl + "/login?google_error="
                    + URLEncoder.encode(msg, StandardCharsets.UTF_8));
            return;
        }
        try {
            AuthResponse authResponse = authService.googleCallback(code);
            String tokenParam = URLEncoder.encode(authResponse.getAccessToken(), StandardCharsets.UTF_8);
            String userParam  = URLEncoder.encode(
                    objectMapper.writeValueAsString(authResponse.getUser()), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/google/callback"
                    + "?access_token=" + tokenParam + "&user=" + userParam);
        } catch (SlifeException e) {
            response.sendRedirect(frontendUrl + "/login?google_error="
                    + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }
}