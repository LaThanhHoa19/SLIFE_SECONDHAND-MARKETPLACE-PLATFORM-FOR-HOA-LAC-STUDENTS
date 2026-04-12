package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.AuthRequest;
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
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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

    private static User user(long id, String email, String status, String passwordHash) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setFullName("U" + id);
        u.setRole("USER");
        u.setStatus(status);
        u.setPasswordHash(passwordHash);
        u.setTokenRevision(0L);
        u.setReputationScore(BigDecimal.ZERO);
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        return u;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Đăng nhập (login)")
    class Login {

        @Test
        @DisplayName("[Lỗi] Không tìm thấy user → USER_NOT_FOUND")
        void userMissing_shouldThrow() {
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.empty());
            AuthRequest req = new AuthRequest();
            req.setEmail("a@ex.com");
            req.setPassword("p");
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.login(req));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Sai mật khẩu (bcrypt) → INVALID_CREDENTIALS")
        void wrongPassword_bcrypt_shouldThrow() {
            User u = user(1L, "a@ex.com", "ACTIVE", "$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(passwordEncoder.matches(eq("p"), anyString())).thenReturn(false);
            AuthRequest req = new AuthRequest();
            req.setEmail("a@ex.com");
            req.setPassword("p");
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.login(req));
            assertEquals(ErrorCode.INVALID_CREDENTIALS, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Email không thuộc sinh viên hợp lệ → INVALID_STUDENT_EMAIL")
        void invalidStudentEmail_shouldThrow() {
            User u = user(1L, "a@ex.com", "ACTIVE", "plain");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            // plain password path
            AuthRequest req = new AuthRequest();
            req.setEmail("a@ex.com");
            req.setPassword("plain");
            when(studentVerificationService.isAllowedStudentEmail("a@ex.com")).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class, () -> authService.login(req));
            assertEquals(ErrorCode.INVALID_STUDENT_EMAIL, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] User BANNED → USER_BANNED")
        void banned_shouldThrow() {
            User u = user(1L, "a@ex.com", "BANNED", "plain");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(studentVerificationService.isAllowedStudentEmail("a@ex.com")).thenReturn(true);
            AuthRequest req = new AuthRequest();
            req.setEmail("a@ex.com");
            req.setPassword("plain");
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.login(req));
            assertEquals(ErrorCode.USER_BANNED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính (plain password) → trả access+refresh token")
        void happyPath_plainPassword_shouldReturnTokens() {
            User u = user(1L, "a@ex.com", "ACTIVE", "plain");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(studentVerificationService.isAllowedStudentEmail("a@ex.com")).thenReturn(true);
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap())).thenReturn("access");
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap(), anyLong())).thenReturn("refresh");
            when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(1000L);
            AuthRequest req = new AuthRequest();
            req.setEmail("a@ex.com");
            req.setPassword("plain");

            AuthResponse out = authService.login(req);

            assertEquals("access", out.getAccessToken());
            assertEquals("refresh", out.getRefreshToken());
            assertNotNull(out.getUser());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Làm mới token (refresh)")
    class Refresh {

        @Test
        @DisplayName("[Lỗi] refreshToken blank → UNAUTHORIZED")
        void blank_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.refresh("   "));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Token bị chặn hoặc không hợp lệ → UNAUTHORIZED")
        void blacklistedOrInvalid_shouldThrow() {
            when(tokenBlacklistService.isBlacklisted("rt")).thenReturn(true);
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.refresh("rt"));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Token typ khác refresh → UNAUTHORIZED")
        void wrongType_shouldThrow() {
            when(tokenBlacklistService.isBlacklisted("rt")).thenReturn(false);
            when(jwtTokenProvider.isTokenValid("rt")).thenReturn(true);
            Claims claims = mock(Claims.class);
            when(claims.get("typ", String.class)).thenReturn("access");
            when(jwtTokenProvider.parseToken("rt")).thenReturn(claims);

            SlifeException ex = assertThrows(SlifeException.class, () -> authService.refresh("rt"));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] Phiên đã thu hồi → UNAUTHORIZED")
        void revoked_shouldThrow() {
            when(tokenBlacklistService.isBlacklisted("rt")).thenReturn(false);
            when(jwtTokenProvider.isTokenValid("rt")).thenReturn(true);
            Claims claims = mock(Claims.class);
            when(claims.get("typ", String.class)).thenReturn("refresh");
            when(claims.getSubject()).thenReturn("a@ex.com");
            when(jwtTokenProvider.parseToken("rt")).thenReturn(claims);
            User u = user(1L, "a@ex.com", "ACTIVE", "plain");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(sessionValidator.isAccessAllowed(claims, u)).thenReturn(false);

            SlifeException ex = assertThrows(SlifeException.class, () -> authService.refresh("rt"));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Thường] Luồng chính: blacklist refresh cũ + phát token mới")
        void happyPath_shouldBlacklistAndReturnTokens() {
            when(tokenBlacklistService.isBlacklisted("rt")).thenReturn(false);
            when(jwtTokenProvider.isTokenValid("rt")).thenReturn(true);
            Claims claims = mock(Claims.class);
            when(claims.get("typ", String.class)).thenReturn("refresh");
            when(claims.getSubject()).thenReturn("a@ex.com");
            when(jwtTokenProvider.parseToken("rt")).thenReturn(claims);
            User u = user(1L, "a@ex.com", "ACTIVE", "plain");
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.of(u));
            when(sessionValidator.isAccessAllowed(claims, u)).thenReturn(true);
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap())).thenReturn("access");
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap(), anyLong())).thenReturn("refresh");
            when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(1000L);

            AuthResponse out = authService.refresh("rt");

            assertEquals("access", out.getAccessToken());
            verify(tokenBlacklistService).blacklist("rt");
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Đăng nhập DEV (devLogin)")
    class DevLogin {

        @Test
        @DisplayName("[Lỗi] email blank → INVALID_INPUT")
        void blank_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.devLogin(" "));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("Đăng nhập Google & callback (googleLogin/googleCallback)")
    class GoogleAuth {

        @Test
        @DisplayName("[Lỗi] googleLogin: credential blank → INVALID_GOOGLE_TOKEN")
        void googleLogin_blank_shouldThrow() {
            GoogleLoginRequest req = new GoogleLoginRequest();
            req.setCredential(" ");
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.googleLogin(req));
            assertEquals(ErrorCode.INVALID_GOOGLE_TOKEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("[Lỗi] googleLogin: domain không cho phép → GOOGLE_DOMAIN_NOT_ALLOWED")
        void googleLogin_domainNotAllowed_shouldThrow() {
            when(googleOAuthClient.verifyIdToken("id")).thenReturn(Map.of(
                    "email", "a@ex.com",
                    "aud", "google-client-id",
                    "email_verified", "true",
                    "name", "A",
                    "picture", "p"
            ));
            when(studentVerificationService.isAllowedStudentEmail("a@ex.com")).thenReturn(false);
            GoogleLoginRequest req = new GoogleLoginRequest();
            req.setCredential("id");
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.googleLogin(req));
            assertEquals(ErrorCode.GOOGLE_DOMAIN_NOT_ALLOWED, ex.getErrorCode());
        }

        @Test
        @DisplayName("googleLogin: user mới → tạo user + gửi welcome + trả token")
        void googleLogin_newUser_shouldCreateAndWelcome() {
            when(googleOAuthClient.verifyIdToken("id")).thenReturn(Map.of(
                    "email", "a@ex.com",
                    "aud", "google-client-id",
                    "email_verified", "true",
                    "name", "A",
                    "picture", "p"
            ));
            when(studentVerificationService.isAllowedStudentEmail("a@ex.com")).thenReturn(true);
            when(userRepository.findByEmail("a@ex.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(10L);
                return u;
            });
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap())).thenReturn("access");
            when(jwtTokenProvider.generateToken(eq("a@ex.com"), anyMap(), anyLong())).thenReturn("refresh");
            when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(1000L);

            GoogleLoginRequest req = new GoogleLoginRequest();
            req.setCredential("id");
            AuthResponse out = authService.googleLogin(req);

            assertEquals("access", out.getAccessToken());
            verify(systemEmailService).trySendWelcomeAfterGoogleLogin(10L);
        }

        @Test
        @DisplayName("[Lỗi] googleCallback: tokenData không có id_token → INVALID_GOOGLE_TOKEN")
        void googleCallback_missingIdToken_shouldThrow() {
            when(googleOAuthClient.exchangeCodeForTokens(anyString(), anyString(), anyString(), anyString()))
                    .thenReturn(Map.of());
            SlifeException ex = assertThrows(SlifeException.class, () -> authService.googleCallback("code"));
            assertEquals(ErrorCode.INVALID_GOOGLE_TOKEN, ex.getErrorCode());
        }
    }
}

