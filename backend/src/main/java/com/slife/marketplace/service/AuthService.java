/**
 * Mục đích: Service AuthService – chỉ hỗ trợ đăng nhập Google SSO (email @fpt.edu.vn).
 */
package com.slife.marketplace.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private static final String ALLOWED_DOMAIN = "fpt.edu.vn";

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public AuthService(
            UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            @Value("${google.clientId}") String googleClientId
    ) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        if (googleClientId == null || googleClientId.isBlank() || "replace-client-id".equals(googleClientId)) {
            throw new IllegalStateException("Google Client ID is not configured. Set GOOGLE_CLIENT_ID in environment or application properties.");
        }
        this.googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * Đăng nhập bằng Google ID token. Chỉ chấp nhận email đuôi @fpt.edu.vn.
     * Tạo user mới nếu chưa tồn tại.
     */
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdToken googleIdToken;
        try {
            googleIdToken = googleIdTokenVerifier.verify(idToken);
        } catch (Exception e) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        if (googleIdToken == null) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new SlifeException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        email = email.toLowerCase();

        // Chỉ cho phép domain fpt.edu.vn (hd claim hoặc email kết thúc bằng @fpt.edu.vn)
        String hd = payload.getHostedDomain();
        boolean domainOk = ALLOWED_DOMAIN.equalsIgnoreCase(hd) || email.endsWith("@" + ALLOWED_DOMAIN);
        if (!domainOk) {
            throw new SlifeException(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED);
        }

        String name = (String) payload.get("name");
        final String fullName = (name != null && !name.isBlank()) ? name : email.substring(0, email.indexOf('@'));
        final String pictureUrl = (String) payload.get("picture");
        final String emailFinal = email;

        User user = userRepository.findByEmail(email).orElseGet(() -> createUserFromGoogle(emailFinal, fullName, pictureUrl));

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        String token = jwtTokenProvider.generateToken(email, claims);

        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setRefreshToken(null);
        response.setUser(user);
        return response;
    }

    private User createUserFromGoogle(String email, String fullName, String avatarUrl) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName != null ? fullName : email);
        user.setPasswordHash(null);
        user.setAvatarUrl(avatarUrl);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setReputationScore(BigDecimal.valueOf(5.00));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
