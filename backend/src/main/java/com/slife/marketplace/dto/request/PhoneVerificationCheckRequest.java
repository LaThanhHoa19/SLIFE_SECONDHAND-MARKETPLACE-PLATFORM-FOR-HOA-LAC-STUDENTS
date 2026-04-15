package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhoneVerificationCheckRequest {
    /** Số E.164 (+84...) sẽ dùng khi gửi OTP Firebase. */
    @NotBlank(message = "phoneNumber is required")
    private String phoneNumber;
}
