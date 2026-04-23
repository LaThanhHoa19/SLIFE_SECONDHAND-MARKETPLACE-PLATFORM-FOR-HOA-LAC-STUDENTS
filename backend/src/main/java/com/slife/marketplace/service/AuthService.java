package com.slife.marketplace.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slife.marketplace.dto.request.AuthRequest;
import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtTokenProvider;
import com.slife.marketplace.security.JwtUserSessionValidator;
import com.slife.marketplace.security.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtUserSessionValidator sessionValidator;
    private final TokenBlacklistService tokenBlacklistService;
    private final StudentVerificationService studentVerificationService;
    private final SystemEmailService systemEmailService;
    private final ObjectMapper objectMapper;
    private final String googleClientId;
    private final String googleClientSecret;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    /** Idle timeout (ms): từ chối refresh nếu token được tạo quá lâu mà không renew. Mặc định 4 giờ. */
    @Value("${app.auth.idle-timeout-ms:14400000}")
    private long idleTimeoutMs;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtUserSessionValidator sessionValidator,
            TokenBlacklistService tokenBlacklistService,
            StudentVerificationService studentVerificationService,
            SystemEmailService systemEmailService,
            ObjectMapper objectMapper,
            @Value("${google.clientId:}") String googleClientId,
            @Value("${google.clientSecret:}") String googleClientSecret
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.sessionValidator = sessionValidator;
        this.tokenBlacklistService = tokenBlacklistService;
        this.studentVerificationService = studentVerificationService;
        this.systemEmailService = systemEmailService;
        this.objectMapper = objectMapper;
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail();
        String rawPassword = request.getPassword();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        String storedHash = user.getPasswordHash();
        boolean passwordOk = isBcryptHash(storedHash)
                ? passwordEncoder.matches(rawPassword, storedHash)
                : rawPassword.equals(storedHash);
        if (!passwordOk) {
            throw new SlifeException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!studentVerificationService.isAllowedStudentEmail(email)) {
            throw new SlifeException(ErrorCode.INVALID_STUDENT_EMAIL);
        }

        assertUserMayReceiveToken(user);
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED, "refreshToken is required");
        }
        if (tokenBlacklistService.isBlacklisted(refreshToken) || !jwtTokenProvider.isTokenValid(refreshToken)) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED, "Invalid refresh token");
        }

        Claims claims = jwtTokenProvider.parseToken(refreshToken);
        String tokenType = claims.get("typ", String.class);
        if (!"refresh".equals(tokenType)) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED, "Invalid refresh token type");
        }

        String email = claims.getSubject();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.UNAUTHORIZED, "User not found for token"));

        if (!sessionValidator.isAccessAllowed(claims, user)) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED, "Session has been revoked");
        }

        // Idle check: từ chối refresh nếu token quá cũ mà không được renew
        // Mỗi lần refresh thành công → cấp refresh token mới với lat = now → reset idle timer
        // Token cũ (không có lat) vẫn pass (backward compatible)
        Object latRaw = claims.get("lat");
        if (latRaw != null) {
            long lat = latRaw instanceof Number n ? n.longValue() : Long.parseLong(latRaw.toString());
            long idleSeconds = java.time.Instant.now().getEpochSecond() - lat;
            if (idleSeconds > idleTimeoutMs / 1000) {
                tokenBlacklistService.blacklist(refreshToken);
                throw new SlifeException(ErrorCode.UNAUTHORIZED, "Session expired due to inactivity");
            }
        }

        tokenBlacklistService.blacklist(refreshToken);
        return buildAuthResponse(user);
    }

    public AuthResponse devLogin(String email) {
        if (email == null || email.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Email is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        assertUserMayReceiveToken(user);
        return buildAuthResponse(user);
    }

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        if (request == null || request.getCredential() == null || request.getCredential().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        Map<String, Object> googlePayload = verifyGoogleIdToken(request.getCredential());
        return buildAuthResponseFromGooglePayload(googlePayload);
    }

    public String getGoogleAuthorizationUrl() {
        String redirectUri = backendUrl + "/api/auth/google/callback";
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + enc(googleClientId)
                + "&redirect_uri=" + enc(redirectUri)
                + "&response_type=code"
                + "&scope=" + enc("openid email profile")
                + "&access_type=online"
                + "&prompt=select_account";
    }

    public AuthResponse googleCallback(String code) {
        String redirectUri = backendUrl + "/api/auth/google/callback";
        Map<String, Object> tokenData = exchangeCodeForTokens(code, redirectUri);
        String idToken = stringValue(tokenData.get("id_token"));
        if (idToken == null) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        Map<String, Object> googlePayload = verifyGoogleIdToken(idToken);
        return buildAuthResponseFromGooglePayload(googlePayload);
    }

    private AuthResponse buildAuthResponseFromGooglePayload(Map<String, Object> payload) {
        String email = stringValue(payload.get("email"));
        String audience = stringValue(payload.get("aud"));
        boolean emailVerified = Boolean.parseBoolean(stringValue(payload.get("email_verified")));
        String fullName = stringValue(payload.get("name"));
        String avatarUrl = stringValue(payload.get("picture"));

        if (email == null || email.isBlank() || !emailVerified) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        // Check domain TRƯỚC audience — đảm bảo user luôn thấy message rõ ràng
        // khi dùng email không phải @fpt.edu.vn, bất kể audience match hay không.
        if (!studentVerificationService.isAllowedStudentEmail(email)) {
            throw new SlifeException(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED);
        }
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(audience)) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        User user = userRepository.findByEmail(email)
                .map(existingUser -> syncGoogleProfile(existingUser, fullName, avatarUrl))
                .orElseGet(() -> createGoogleUser(email, fullName, avatarUrl));
        assertUserMayReceiveToken(user);
        AuthResponse response = buildAuthResponse(user);
        systemEmailService.trySendWelcomeAfterGoogleLogin(user.getId());
        return response;
    }

    private static boolean isBcryptHash(String value) {
        if (value == null || value.length() < 10) return false;
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private Map<String, Object> buildClaims(User user, String tokenType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        claims.put("typ", tokenType);
        long tv = user.getTokenRevision() == null ? 0L : user.getTokenRevision();
        claims.put("tv", tv);
        // Idle check: ghi thời điểm tạo refresh token để backend kiểm tra khi refresh
        if ("refresh".equals(tokenType)) {
            claims.put("lat", java.time.Instant.now().getEpochSecond());
        }
        return claims;
    }

    private static void assertUserMayReceiveToken(User user) {
        if (user.getStatus() != null && "BANNED".equalsIgnoreCase(user.getStatus().trim())) {
            throw new SlifeException(ErrorCode.USER_BANNED);
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), buildClaims(user, "access"));
        String refreshToken = jwtTokenProvider.generateToken(
                user.getEmail(),
                buildClaims(user, "refresh"),
                jwtTokenProvider.getRefreshExpirationMs());

        AuthResponse response = new AuthResponse();
        response.setToken(accessToken);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUser(user);
        return response;
    }

    private User createGoogleUser(String email, String fullName, String avatarUrl) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName != null && !fullName.isBlank() ? fullName : email.substring(0, email.indexOf('@')));
        user.setAvatarUrl(blankToNull(avatarUrl));
        user.setPasswordHash(null);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setReputationScore(BigDecimal.valueOf(0.00));
        user.setViolationCount(0);
        user.setTokenRevision(0L);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private User syncGoogleProfile(User user, String fullName, String avatarUrl) {
        boolean changed = false;
        String normalizedFullName = fullName != null && !fullName.isBlank() ? fullName : user.getFullName();
        String normalizedAvatarUrl = blankToNull(avatarUrl);

        if (normalizedFullName != null && !normalizedFullName.equals(user.getFullName())) {
            user.setFullName(normalizedFullName);
            changed = true;
        }
        if (normalizedAvatarUrl != null && !normalizedAvatarUrl.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(normalizedAvatarUrl);
            changed = true;
        }

        if (!changed) {
            return user;
        }

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private Map<String, Object> verifyGoogleIdToken(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + enc(idToken)))
                    .GET()
                    .build();
            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    private Map<String, Object> exchangeCodeForTokens(String code, String redirectUri) {
        try {
            String body = "code=" + enc(code)
                    + "&client_id=" + enc(googleClientId)
                    + "&client_secret=" + enc(googleClientSecret)
                    + "&redirect_uri=" + enc(redirectUri)
                    + "&grant_type=authorization_code";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (SlifeException e) {
            throw e;
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }

    private static String stringValue(Object value) {
        return value != null ? String.valueOf(value) : null;
    }

    private static String blankToNull(String value) {
        return value != null && !value.isBlank() ? value : null;
    }

    public long getRefreshTokenTtlSeconds() {
        return Math.max(1L, jwtTokenProvider.getRefreshExpirationMs() / 1000L);
    }
}
