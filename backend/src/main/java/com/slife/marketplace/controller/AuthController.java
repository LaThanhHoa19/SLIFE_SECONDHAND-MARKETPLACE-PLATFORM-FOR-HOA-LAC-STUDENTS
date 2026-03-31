package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.AuthRequest;
import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.request.LogoutRequest;
import com.slife.marketplace.dto.request.RefreshTokenRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.security.LoginRateLimitService;
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
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;
    private final LoginRateLimitService loginRateLimitService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${auth.dev-login-enabled:false}")
    private boolean devLoginEnabled;

    public AuthController(AuthService authService,
                          TokenBlacklistService tokenBlacklistService,
                          LoginRateLimitService loginRateLimitService) {
        this.authService = authService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.loginRateLimitService = loginRateLimitService;
    }

    @PostMapping("/dev-login")
    public ResponseEntity<ApiResponse<AuthResponse>> devLogin(@RequestParam("email") String email) {
        if (!devLoginEnabled) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "dev-login is disabled");
        }
        return ResponseEntity.ok(ApiResponse.success("Dev login successful", authService.devLogin(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request,
                                                            HttpServletRequest httpRequest) {
        String key = buildRateLimitKey(httpRequest, request.getEmail());
        loginRateLimitService.assertAllowed(key);
        try {
            AuthResponse auth = authService.login(request);
            loginRateLimitService.recordSuccess(key);
            return ResponseEntity.ok(ApiResponse.success("Login successful", auth));
        } catch (SlifeException ex) {
            if (ex.getErrorCode() == ErrorCode.INVALID_CREDENTIALS || ex.getErrorCode() == ErrorCode.USER_NOT_FOUND) {
                loginRateLimitService.recordFailure(key);
            }
            throw ex;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse auth = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", auth));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request,
                                                    @RequestBody(required = false) LogoutRequest body) {
        String bearer = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            tokenBlacklistService.blacklist(bearer.substring(7));
        }
        if (body != null && StringUtils.hasText(body.getRefreshToken())) {
            tokenBlacklistService.blacklist(body.getRefreshToken());
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
            response.sendRedirect(frontendUrl + "/auth/google/callback?access_token=" + tokenParam);
        } catch (SlifeException e) {
            response.sendRedirect(frontendUrl + "/login?google_error="
                    + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private static String buildRateLimitKey(HttpServletRequest req, String email) {
        String ip = req.getRemoteAddr();
        String em = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return "login:" + ip + ":" + em;
    }
}
