package com.slife.marketplace.exception;

import com.slife.marketplace.dto.response.BaseResponse;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.util.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({ MethodArgumentNotValidException.class, BindException.class })
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(Exception ex) {
        FieldError fieldError = null;
        if (ex instanceof MethodArgumentNotValidException manv) {
            fieldError = manv.getBindingResult().getFieldError();
        } else if (ex instanceof BindException be) {
            fieldError = be.getBindingResult().getFieldError();
        }

        String code = "MSG02";
        String message = "The field is required";

        if (fieldError != null) {
            String field = fieldError.getField();
            String defaultMsg = fieldError.getDefaultMessage();

            // Phone number format (mapped in UpdateUserRequest)
            if ("INVALID_PHONE_FORMAT".equals(defaultMsg)) {
                code = "MSG12";
                message = "Please enter a valid phone number";
            }
            // Max length violations (contains 'must not exceed')
            else if (defaultMsg != null && defaultMsg.contains("must not exceed")) {
                code = "MSG08";
                message = defaultMsg;
            }
            // Email format issues
            else if (defaultMsg != null &&
                    (defaultMsg.toLowerCase().contains("must be a well-formed email address")
                            || field.toLowerCase().contains("email"))) {
                code = "MSG21";
                message = "Please enter a valid email address";
            }
            // Required field missing
            else {
                code = "MSG02";
                message = "The " + field + " field is required";
            }
        }

        ApiResponse<Object> body = ApiResponse.error(code, message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(SlifeException.class)
    public ResponseEntity<ApiResponse<Object>> handleSlifeException(SlifeException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        if (errorCode == ErrorCode.FORBIDDEN) {
            ApiResponse<Object> body = ApiResponse.error("MSG23", Constants.MSG23);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }
        ApiResponse<Object> body = ApiResponse.error(errorCode.getCode(), ex.getMessage());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<BaseResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        BaseResponse<Object> body = new BaseResponse<>("FORBIDDEN", "Bạn không có quyền truy cập tính năng này", null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /** JSON sai định dạng / thiếu field — tránh 500 chung chung. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Bad request body: {}", ex.getMessage());
        String hint = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        ApiResponse<Object> body = ApiResponse.error(ErrorCode.INVALID_INPUT.getCode(),
                "Dữ liệu gửi lên không hợp lệ (JSON). " + (hint != null ? hint : ""));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnexpected(Exception ex) {
        log.error("Unexpected exception", ex);
        ApiResponse<Object> body = ApiResponse.error(
                ErrorCode.INTERNAL_ERROR.getCode(),
                "Internal server error: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
