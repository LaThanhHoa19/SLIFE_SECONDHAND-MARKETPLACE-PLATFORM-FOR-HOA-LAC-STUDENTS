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
    SAVED_LISTING_ALREADY("SAVED_LISTING_ALREADY", "Listing already saved", HttpStatus.CONFLICT),
    SAVED_LISTING_NOT_SAVED("SAVED_LISTING_NOT_SAVED", "Listing was not saved", HttpStatus.NOT_FOUND),

    // Upload
    FILE_UPLOAD_FAILED("FILE_UPLOAD_FAILED", "Upload failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // Chat & negotiation
    CHAT_SESSION_NOT_FOUND("CHAT_SESSION_NOT_FOUND", "Chat session not found", HttpStatus.NOT_FOUND),
    NOT_CHAT_PARTICIPANT("NOT_CHAT_PARTICIPANT", "You do not have permission", HttpStatus.FORBIDDEN),
    USER_BANNED_OR_RESTRICTED("USER_BANNED_OR_RESTRICTED", "You cannot send messages", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Max 1 message per second", HttpStatus.TOO_MANY_REQUESTS),
    OFFER_PRICE_INVALID("OFFER_PRICE_INVALID", "Offer price must be positive and lower than listing price", HttpStatus.BAD_REQUEST),
    OFFER_NOT_FOUND("OFFER_NOT_FOUND", "Offer not found", HttpStatus.NOT_FOUND),
    DEAL_NOT_FOUND("DEAL_NOT_FOUND", "Deal not found", HttpStatus.NOT_FOUND),
    OFFER_SPAM_LIMIT("OFFER_SPAM_LIMIT", "You have reached the maximum offer limit (5) for this listing (BR-35)", HttpStatus.TOO_MANY_REQUESTS),
    OFFER_NOT_PENDING("OFFER_NOT_PENDING", "Offer is no longer pending", HttpStatus.CONFLICT),
    FILE_TOO_LARGE("FILE_TOO_LARGE", "File exceeds 5 MB limit", HttpStatus.PAYLOAD_TOO_LARGE),
    INVALID_FILE_TYPE("INVALID_FILE_TYPE", "Only JPG, PNG, WebP images are allowed", HttpStatus.UNSUPPORTED_MEDIA_TYPE),

    // Comment related
    COMMENT_NOT_FOUND("COMMENT_NOT_FOUND", "Comment not found", HttpStatus.NOT_FOUND),
    COMMENT_DELETE_FORBIDDEN("COMMENT_DELETE_FORBIDDEN", "Only the comment author, listing owner or admin can delete this comment", HttpStatus.FORBIDDEN),

    // Report related
    REPORT_NOT_FOUND("REPORT_NOT_FOUND", "Report not found", HttpStatus.NOT_FOUND),
    REPORT_DUPLICATE("REPORT_DUPLICATE", "You have already reported this item", HttpStatus.CONFLICT),
    REPORT_SELF("REPORT_SELF", "You cannot report your own content", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_TARGET("REPORT_INVALID_TARGET", "Invalid report target type (must be LISTING or USER)", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_STATUS("REPORT_INVALID_STATUS", "Invalid resolve status (must be RESOLVED or DISMISSED)", HttpStatus.BAD_REQUEST);

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

