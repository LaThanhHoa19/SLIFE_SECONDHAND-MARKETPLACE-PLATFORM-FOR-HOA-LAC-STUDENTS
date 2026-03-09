/**
 * Mục đích: Service AuthService
 * Endpoints liên quan: controller
 */
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
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StudentVerificationService studentVerificationService;
    private final ObjectMapper objectMapper;
    private final String googleClientId;
    private final String googleClientSecret;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            StudentVerificationService studentVerificationService,
            ObjectMapper objectMapper,
            @Value("${google.clientId:}") String googleClientId,
            @Value("${google.clientSecret:}") String googleClientSecret
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.studentVerificationService = studentVerificationService;
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

        String token = jwtTokenProvider.generateToken(email, buildClaims(user));
        return buildAuthResponse(token, user);
    }

    /** Popup-based flow: verify credential JWT directly from GIS */
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        if (request == null || request.getCredential() == null || request.getCredential().isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        Map<String, Object> googlePayload = verifyGoogleIdToken(request.getCredential());
        return buildAuthResponseFromGooglePayload(googlePayload);
    }

    /** Step 1 of redirect flow: build the Google authorization URL */
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

    /** Step 2 of redirect flow: exchange authorization code for tokens */
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

    // ─── Private helpers ───────────────────────────────────────────────────────

    private AuthResponse buildAuthResponseFromGooglePayload(Map<String, Object> payload) {
        String email = stringValue(payload.get("email"));
        String audience = stringValue(payload.get("aud"));
        boolean emailVerified = Boolean.parseBoolean(stringValue(payload.get("email_verified")));
        String fullName = stringValue(payload.get("name"));
        String avatarUrl = stringValue(payload.get("picture"));

        if (email == null || email.isBlank() || !emailVerified) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(audience)) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        if (!studentVerificationService.isAllowedStudentEmail(email)) {
            throw new SlifeException(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED);
        }

        User user = userRepository.findByEmail(email)
                .map(existingUser -> syncGoogleProfile(existingUser, fullName, avatarUrl))
                .orElseGet(() -> createGoogleUser(email, fullName, avatarUrl));
        String token = jwtTokenProvider.generateToken(email, buildClaims(user));
        return buildAuthResponse(token, user);
    }

    private static boolean isBcryptHash(String value) {
        if (value == null || value.length() < 10) return false;
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        return claims;
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setAccessToken(token);
        response.setRefreshToken(null);
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
        user.setReputationScore(BigDecimal.valueOf(5.00));
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
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

        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    /** Verify a Google ID token via tokeninfo endpoint (works for both popup and redirect flows) */
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

    /** Exchange OAuth2 authorization code for tokens */
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
}
