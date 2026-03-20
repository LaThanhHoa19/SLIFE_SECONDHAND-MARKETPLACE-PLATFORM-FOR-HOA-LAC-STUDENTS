package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyPhoneRequest {

    @Pattern(
            regexp = "^(\\+?84|0)(3\\d{8}|5\\d{8}|7\\d{8}|8\\d{8}|9\\d{8})$",
            message = "INVALID_PHONE_FORMAT"
    )
    private String phoneNumber;

    /**
     * OTP code cho môi trường dev test (ví dụ: 12345).
     */
    private String verificationCode;

    /**
     * Firebase Auth ID token (nếu muốn verify thật bằng Firebase Admin).
     */
    private String firebaseIdToken;
}

