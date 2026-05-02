package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.GoogleLoginRequest;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.integrations.google.GoogleOAuthClient;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtTokenProvider;
import com.slife.marketplace.security.JwtUserSessionValidator;
import com.slife.marketplace.security.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Google Login focused")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private JwtUserSessionValidator sessionValidator;
    @Mock private TokenBlacklistService tokenBlacklistService;
    @Mock private StudentVerificationService studentVerificationService;
    @Mock private SystemEmailService systemEmailService;
    @Mock private GoogleOAuthClient googleOAuthClient;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtTokenProvider,
                sessionValidator,
                tokenBlacklistService,
                studentVerificationService,
                systemEmailService,
                googleOAuthClient,
                "google-client-id",
                "google-client-secret"
        );
    }

    private static GoogleLoginRequest googleReq(String credential) {
        GoogleLoginRequest req = new GoogleLoginRequest();
        req.setCredential(credential);
        return req;
    }

    private void stubTokenGeneration(String email) {
        when(jwtTokenProvider.generateToken(eq(email), anyMap())).thenReturn("access");
        when(jwtTokenProvider.generateToken(eq(email), anyMap(), anyLong())).thenReturn("refresh");
        when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(1000L);
    }

    @Nested
    @DisplayName("Google Login | Function: googleLogin(GoogleLoginRequest)")
    class GoogleLoginUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] Sinh viên FPT login Google lần đầu -> tạo tài khoản + welcome email")
        void utcid01_googleFirstLoginCreateUser() {
            when(googleOAuthClient.verifyIdToken("id")).thenReturn(Map.of(
                    "email", "first@fpt.edu.vn",
                    "aud", "google-client-id",
                    "email_verified", "true",
                    "name", "First User",
                    "picture", "pic"
            ));
            when(studentVerificationService.isAllowedStudentEmail("first@fpt.edu.vn")).thenReturn(true);
            when(userRepository.findByEmail("first@fpt.edu.vn")).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User saved = inv.getArgument(0);
                saved.setId(100L);
                return saved;
            });
            stubTokenGeneration("first@fpt.edu.vn");

            AuthResponse out = authService.googleLogin(googleReq("id"));

            assertEquals("access", out.getAccessToken());
            assertEquals("refresh", out.getRefreshToken());
            verify(systemEmailService).trySendWelcomeAfterGoogleLogin(100L);
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID02 [A] Login Google bằng email cá nhân -> GOOGLE_DOMAIN_NOT_ALLOWED")
        void utcid02_googlePersonalEmailBlocked() {
            when(googleOAuthClient.verifyIdToken("id")).thenReturn(Map.of(
                    "email", "someone@gmail.com",
                    "aud", "google-client-id",
                    "email_verified", "true",
                    "name", "Someone",
                    "picture", "pic"
            ));
            when(studentVerificationService.isAllowedStudentEmail("someone@gmail.com")).thenReturn(false);

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> authService.googleLogin(googleReq("id"))
            );
            assertEquals(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED, ex.getErrorCode());
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID03 [A] Google token hết hạn/giả mạo -> INVALID_GOOGLE_TOKEN")
        void utcid03_invalidGoogleToken() {
            when(googleOAuthClient.verifyIdToken("bad")).thenReturn(Map.of(
                    "email", "first@fpt.edu.vn",
                    "aud", "google-client-id",
                    "email_verified", "false"
            ));

            SlifeException ex = assertThrows(
                    SlifeException.class,
                    () -> authService.googleLogin(googleReq("bad"))
            );
            assertEquals(ErrorCode.INVALID_GOOGLE_TOKEN, ex.getErrorCode());
        }
    }
}
