package com.slife.marketplace.exception;

import org.springframework.http.HttpStatus;

/**
 * Central place to keep business error codes and default messages.
 * Codes can be mapped to MSGxx in the requirements document.
 */
public enum ErrorCode {

    // Generic
    SUCCESS("SUCCESS", "Thành công", HttpStatus.OK),
    INTERNAL_ERROR("INTERNAL_ERROR", "Lỗi hệ thống nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),

    // Common validation / auth
    INVALID_INPUT("INVALID_INPUT", "Dữ liệu nhập vào không hợp lệ", HttpStatus.BAD_REQUEST),
    CONFIGURATION_NOT_FOUND("CONFIGURATION_NOT_FOUND", "Không tìm thấy cấu hình hệ thống", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("UNAUTHORIZED", "Vui lòng đăng nhập để tiếp tục", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),

    // User related
    USER_NOT_FOUND("USER_NOT_FOUND", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_IN_USE("EMAIL_ALREADY_IN_USE", "Email này đã được sử dụng", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    INVALID_STUDENT_EMAIL("INVALID_STUDENT_EMAIL", "Chỉ chấp nhận email sinh viên @fpt.edu.vn", HttpStatus.BAD_REQUEST),
    INVALID_GOOGLE_TOKEN("INVALID_GOOGLE_TOKEN", "Phiên đăng nhập Google hết hạn", HttpStatus.UNAUTHORIZED),
    GOOGLE_DOMAIN_NOT_ALLOWED("GOOGLE_DOMAIN_NOT_ALLOWED", "Chỉ tài khoản @fpt.edu.vn mới có thể đăng nhập", HttpStatus.FORBIDDEN),
    USER_BANNED("USER_BANNED", "Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN),

    // Listing related
    LISTING_NOT_FOUND("LISTING_NOT_FOUND", "Không tìm thấy tin đăng", HttpStatus.NOT_FOUND),
    /** Tin đã có giao dịch hoàn tất / đang giữ chỗ — không chốt đơn hoặc chấp nhận trùng. */
    LISTING_DEAL_CONFLICT("LISTING_DEAL_CONFLICT", "Tin này đã có giao dịch với người mua khác hoặc đã bán.", HttpStatus.CONFLICT),
    COMMUNITY_POST_NOT_FOUND("COMMUNITY_POST_NOT_FOUND", "Không tìm thấy bài viết cộng đồng", HttpStatus.NOT_FOUND),
    LISTING_NOT_DRAFT("LISTING_NOT_DRAFT", "Chỉ tin nháp mới có thể xóa", HttpStatus.CONFLICT),
    LISTING_NOT_EXPIRED("LISTING_NOT_EXPIRED", "Chỉ tin đã hết hạn mới có thể đăng lại", HttpStatus.CONFLICT),
    LISTING_MOD_HIDDEN_REPOST_FORBIDDEN("LISTING_MOD_HIDDEN_REPOST_FORBIDDEN", "Tin bị ẩn bởi quản trị viên không thể đăng lại", HttpStatus.CONFLICT),
    LISTING_NOT_RENEWABLE("LISTING_NOT_RENEWABLE", "Chỉ có thể gia hạn tin trong vòng 7 ngày trước khi hết hạn", HttpStatus.CONFLICT),
    SAVED_LISTING_ALREADY("SAVED_LISTING_ALREADY", "Bạn đã lưu tin này rồi", HttpStatus.CONFLICT),
    SAVED_LISTING_NOT_SAVED("SAVED_LISTING_NOT_SAVED", "Bạn chưa lưu tin này", HttpStatus.NOT_FOUND),
    LISTING_QUOTA_EXCEEDED("LISTING_QUOTA_EXCEEDED", "Bạn đã đạt giới hạn số lượng tin đăng tối đa", HttpStatus.CONFLICT),
    BANNED_KEYWORD_IN_CONTENT("BANNED_KEYWORD_IN_CONTENT", "Nội dung chứa từ ngữ không phù hợp được giới hạn", HttpStatus.BAD_REQUEST),

    // Follow
    FOLLOW_SELF("FOLLOW_SELF", "Bạn không thể theo dõi chính mình", HttpStatus.BAD_REQUEST),
    FOLLOW_ALREADY("FOLLOW_ALREADY", "Bạn đã theo dõi người dùng này rồi", HttpStatus.CONFLICT),
    FOLLOW_NOT_FOLLOWING("FOLLOW_NOT_FOLLOWING", "Bạn chưa theo dõi người dùng này", HttpStatus.NOT_FOUND),
    FOLLOW_BLOCKED("FOLLOW_BLOCKED", "Không thể theo dõi do có người dùng đã bị chặn", HttpStatus.FORBIDDEN),

    // Upload
    FILE_UPLOAD_FAILED("FILE_UPLOAD_FAILED", "Tải file lên không thành công", HttpStatus.INTERNAL_SERVER_ERROR),

    // Chat & negotiation
    CHAT_SESSION_NOT_FOUND("CHAT_SESSION_NOT_FOUND", "Không tìm thấy cuộc hội thoại", HttpStatus.NOT_FOUND),
    NOT_CHAT_PARTICIPANT("NOT_CHAT_PARTICIPANT", "Bạn không có quyền tham gia cuộc hội thoại này", HttpStatus.FORBIDDEN),
    USER_BANNED_OR_RESTRICTED("USER_BANNED_OR_RESTRICTED", "Tài khoản bị hạn chế gửi tin nhắn", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Tốc độ gửi tin nhắn quá nhanh (tối đa 1 tin/giây)", HttpStatus.TOO_MANY_REQUESTS),
    OFFER_PRICE_INVALID("OFFER_PRICE_INVALID", "Giá đề nghị phải là số dương và thấp hơn giá gốc", HttpStatus.BAD_REQUEST),
    OFFER_NOT_FOUND("OFFER_NOT_FOUND", "Không tìm thấy đề nghị trả giá", HttpStatus.NOT_FOUND),
    DEAL_NOT_FOUND("DEAL_NOT_FOUND", "Không tìm thấy giao dịch", HttpStatus.NOT_FOUND),
    OFFER_NOT_PENDING("OFFER_NOT_PENDING", "Đề nghị này không còn ở trạng thái chờ", HttpStatus.CONFLICT),
    FILE_TOO_LARGE("FILE_TOO_LARGE", "File vượt quá giới hạn 5 MB", HttpStatus.PAYLOAD_TOO_LARGE),
    INVALID_FILE_TYPE("INVALID_FILE_TYPE", "Chỉ chấp nhận định dạng ảnh JPG, PNG, WebP", HttpStatus.UNSUPPORTED_MEDIA_TYPE),

    // Comment related
    COMMENT_NOT_FOUND("COMMENT_NOT_FOUND", "Không tìm thấy bình luận", HttpStatus.NOT_FOUND),
    COMMUNITY_POST_COMMENT_NOT_FOUND("COMMUNITY_POST_COMMENT_NOT_FOUND", "Không tìm thấy bình luận bài viết", HttpStatus.NOT_FOUND),
    COMMENT_DELETE_FORBIDDEN("COMMENT_DELETE_FORBIDDEN", "Bạn không có quyền xóa bình luận này", HttpStatus.FORBIDDEN),

    // Report related
    MESSAGE_NOT_FOUND("MESSAGE_NOT_FOUND", "Không tìm thấy tin nhắn", HttpStatus.NOT_FOUND),
    REPORT_NOT_FOUND("REPORT_NOT_FOUND", "Không tìm thấy báo cáo", HttpStatus.NOT_FOUND),
    REPORT_DUPLICATE("REPORT_DUPLICATE", "Bạn đã báo cáo nội dung này rồi", HttpStatus.CONFLICT),
    REPORT_SELF("REPORT_SELF", "Bạn không thể tự báo cáo chính mình", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_TARGET("REPORT_INVALID_TARGET", "Đối tượng báo cáo không hợp lệ", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_STATUS("REPORT_INVALID_STATUS", "Trạng thái xử lý không hợp lệ (phải là RESOLVED hoặc REJECTED)", HttpStatus.BAD_REQUEST);

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

