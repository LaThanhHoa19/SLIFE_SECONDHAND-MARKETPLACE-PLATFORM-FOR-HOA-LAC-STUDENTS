/**
 * Mục đích: DTO response AuthResponse
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AuthResponse {
    /** JWT access token for API calls. */
    @JsonProperty("accessToken")
    private String accessToken;
    /** Optional refresh token (null when using Google SSO only). */
    @JsonProperty("refreshToken")
    private String refreshToken;
    @JsonProperty("user")
    private Object user;
}