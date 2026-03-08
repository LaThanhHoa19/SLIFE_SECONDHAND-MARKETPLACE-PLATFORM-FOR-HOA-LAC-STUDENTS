package com.slife.marketplace.exception;

import org.springframework.http.HttpStatus;

/**
 * Central place to keep business error codes and default messages.
 * Codes can be mapped to MSGxx in the requirements document.
 */
public enum ErrorCode {

    // Generic
    SUCCESS("SUCCESS", "Success", HttpStatus.OK),
    INTERNAL_ERROR("INTERNAL_ERROR", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),

    // Common validation / auth
    INVALID_INPUT("INVALID_INPUT", "Invalid input data", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", "Authentication required", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "Access is denied", HttpStatus.FORBIDDEN),

    // User related
    USER_NOT_FOUND("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_IN_USE("EMAIL_ALREADY_IN_USE", "Email is already in use", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED),
    INVALID_STUDENT_EMAIL("INVALID_STUDENT_EMAIL", "Only @fpt.edu.vn email is allowed", HttpStatus.BAD_REQUEST),
    INVALID_GOOGLE_TOKEN("INVALID_GOOGLE_TOKEN", "Invalid or expired Google sign-in token", HttpStatus.UNAUTHORIZED),
    GOOGLE_DOMAIN_NOT_ALLOWED("GOOGLE_DOMAIN_NOT_ALLOWED", "Only @fpt.edu.vn email is allowed to sign in", HttpStatus.FORBIDDEN),

    // Listing related
    LISTING_NOT_FOUND("LISTING_NOT_FOUND", "Listing not found", HttpStatus.NOT_FOUND),

    // Upload
    FILE_UPLOAD_FAILED("FILE_UPLOAD_FAILED", "Upload failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // Chat & negotiation
    CHAT_SESSION_NOT_FOUND("CHAT_SESSION_NOT_FOUND", "Chat session not found", HttpStatus.NOT_FOUND),
    NOT_CHAT_PARTICIPANT("NOT_CHAT_PARTICIPANT", "You do not have permission", HttpStatus.FORBIDDEN),
    USER_BANNED_OR_RESTRICTED("USER_BANNED_OR_RESTRICTED", "You cannot send messages", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Max 1 message per second", HttpStatus.TOO_MANY_REQUESTS),
    OFFER_PRICE_INVALID("OFFER_PRICE_INVALID", "Offer price must be positive and lower than listing price", HttpStatus.BAD_REQUEST),
    OFFER_NOT_FOUND("OFFER_NOT_FOUND", "Offer not found", HttpStatus.NOT_FOUND),
    DEAL_NOT_FOUND("DEAL_NOT_FOUND", "Deal not found", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}

