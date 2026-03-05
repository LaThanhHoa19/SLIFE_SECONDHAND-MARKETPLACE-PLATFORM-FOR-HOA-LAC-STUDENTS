/**
 * Mục đích: Service AuthService
 * Endpoints liên quan: controller
 */
package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.AuthRequest;
import com.slife.marketplace.dto.response.AuthResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StudentVerificationService studentVerificationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            StudentVerificationService studentVerificationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.studentVerificationService = studentVerificationService;
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail();
        String rawPassword = request.getPassword();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        String storedHash = user.getPasswordHash();
        boolean passwordOk = isBcryptHash(storedHash)
                ? passwordEncoder.matches(rawPassword, storedHash)
                : rawPassword.equals(storedHash); // legacy/plain-text (chỉ dev)
        if (!passwordOk) {
            throw new SlifeException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!studentVerificationService.isAllowedStudentEmail(email)) {
            throw new SlifeException(ErrorCode.INVALID_STUDENT_EMAIL);
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());

        String token = jwtTokenProvider.generateToken(email, claims);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(user);
        return response;
    }

    /** Chuỗi trong DB có dạng BCrypt ($2a$, $2b$, $2y$) hay không. */
    private static boolean isBcryptHash(String value) {
        if (value == null || value.length() < 10) return false;
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }
}
