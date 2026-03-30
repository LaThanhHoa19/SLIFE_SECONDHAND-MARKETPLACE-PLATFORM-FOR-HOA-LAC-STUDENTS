package com.slife.marketplace.dto.request;

import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}
