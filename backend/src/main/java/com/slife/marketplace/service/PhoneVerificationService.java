package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.VerifyPhoneRequest;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Objects;

@Service
public class PhoneVerificationService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final FirebasePhoneAuthService firebasePhoneAuthService;
    private final Environment environment;

    private final String devOtp;

    public PhoneVerificationService(
            UserRepository userRepository,
            UserService userService,
            FirebasePhoneAuthService firebasePhoneAuthService,
            Environment environment
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.firebasePhoneAuthService = firebasePhoneAuthService;
        this.environment = environment;
        // Default OTP when user wants to test without Firebase cost.
        this.devOtp = Objects.requireNonNullElse(
                System.getenv("APP_FIREBASE_DEV_OTP"),
                "12345"
        );
    }

    public User verifyAndSetPhone(VerifyPhoneRequest request) {
        if (request == null) throw new SlifeException(ErrorCode.INVALID_INPUT);
        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Phone number is required");
        }

        User user = userService.getCurrentUser();
        String nextPhone = normalizePhoneNumber(request.getPhoneNumber());

        boolean verified;
        if (request.getFirebaseIdToken() != null && !request.getFirebaseIdToken().trim().isEmpty()) {
            String tokenPhone = normalizePhoneNumber(firebasePhoneAuthService.verifyPhoneNumberFromIdToken(request.getFirebaseIdToken()));
            if (tokenPhone == null || !tokenPhone.equals(nextPhone)) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "INVALID_PHONE_VERIFICATION");
            }
            verified = true;
        } else {
            // Dev-only bypass (tự nhập OTP cố định để test UI, không tốn SMS).
            if (!isDevProfile()) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "Phone verification requires Firebase id token");
            }
            String code = request.getVerificationCode();
            verified = code != null && code.trim().equals(devOtp);
            if (!verified) {
                throw new SlifeException(ErrorCode.INVALID_INPUT, "INVALID_PHONE_VERIFICATION");
            }
        }

        user.setPhoneNumber(nextPhone);
        user.setPhoneNumberVerified(verified);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private boolean isDevProfile() {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch(p -> p.equalsIgnoreCase("dev"));
    }

    private String normalizePhoneNumber(String raw) {
        if (raw == null) return null;
        String p = raw.trim().replaceAll("[\\s-]", "");
        if (p.startsWith("00")) return "+" + p.substring(2);
        if (p.startsWith("0")) return "+84" + p.substring(1);
        if (p.startsWith("+")) return p;
        return p;
    }
}

