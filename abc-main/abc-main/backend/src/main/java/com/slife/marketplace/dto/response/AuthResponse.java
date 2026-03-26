package com.slife.marketplace.dto.response;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private Object user;
}