package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirebasePhoneVerifyRequest {
    @NotBlank(message = "idToken is required")
    private String idToken;
}
