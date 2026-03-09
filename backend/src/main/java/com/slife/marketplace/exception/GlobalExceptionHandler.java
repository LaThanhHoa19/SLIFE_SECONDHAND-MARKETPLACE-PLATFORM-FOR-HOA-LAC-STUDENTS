/**
 * Mục đích: Global API errors
 * Endpoints liên quan: all
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.exception;

import com.slife.marketplace.dto.response.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import com.slife.marketplace.util.Constants;

import org.springframework.security.access.AccessDeniedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        log.warn("Validation failed: {}", e.getMessage());
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(ErrorCode.INVALID_INPUT.getCode());
        response.setMessage(ErrorCode.INVALID_INPUT.getMessage());
        response.setDetails(e.getBindingResult());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingPart(MissingServletRequestPartException e) {
        log.warn("Missing request part: {}", e.getRequestPartName());
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(ErrorCode.INVALID_INPUT.getCode());
        response.setMessage("Thiếu file upload. Gửi với key 'file'.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(ErrorCode.FORBIDDEN.getCode());
        response.setMessage(Constants.MSG23);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(SlifeException.class)
    public ResponseEntity<ApiErrorResponse> handleSlife(SlifeException e) {
        log.warn("SlifeException: code={}, message={}", e.getErrorCode().getCode(), e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(errorCode.getCode());
        response.setMessage(e.getMessage());
        response.setDetails(e.getDetails());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception e) {
        log.error("=== INTERNAL SERVER ERROR ===");
        log.error("Exception class: {}", e.getClass().getName());
        log.error("Exception message: {}", e.getMessage());
        log.error("Full stack trace:", e);
        Throwable cause = e.getCause();
        int level = 0;
        while (cause != null && level < 10) {
            log.error("Caused by [{}]: {} - {}", level, cause.getClass().getName(), cause.getMessage());
            log.error("Cause stack trace:", cause);
            cause = cause.getCause();
            level++;
        }
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(ErrorCode.INTERNAL_ERROR.getCode());
        response.setMessage(ErrorCode.INTERNAL_ERROR.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

