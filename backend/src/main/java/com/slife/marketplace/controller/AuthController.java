package com.slife.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.request.AuthRequest;
import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    /**
     * DEV ONLY: quick login by email to get JWT for local testing.
     * Example: POST /api/auth/dev-login?email=an.do@example.com
     */
    @PostMapping("/api/auth/dev-login")
    public ResponseEntity<ApiResponse<AuthResponse>> devLogin(@RequestParam String email) {
        AuthResponse authResponse = authService.devLogin(email);
        return ResponseEntity.ok(ApiResponse.success("Dev login successful", authResponse));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    /** Popup/credential flow (Google Identity Services) */
    @PostMapping("/api/auth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse authResponse = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Google login successful", authResponse));
    }

    /** Step 1: Redirect browser to Google's OAuth2 consent page */
    @GetMapping("/api/auth/google/init")
    public void googleInit(HttpServletResponse response) throws IOException {
        response.sendRedirect(authService.getGoogleAuthorizationUrl());
    }

    /** Step 2: Google redirects back here with an authorization code */
    @GetMapping("/api/auth/google/callback")
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
            String userParam = URLEncoder.encode(
                    objectMapper.writeValueAsString(authResponse.getUser()), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/google/callback"
                    + "?access_token=" + tokenParam
                    + "&user=" + userParam);
        } catch (SlifeException e) {
            response.sendRedirect(frontendUrl + "/login?google_error="
                    + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }
}
