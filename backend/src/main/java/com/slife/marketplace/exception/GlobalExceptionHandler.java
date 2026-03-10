package com.slife.marketplace.exception;

import com.slife.marketplace.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle bean validation errors for @Valid DTOs (e.g. SearchRequest).
     * SCRUM-47 / BR-06: trả về BaseResponse (ApiResponse) với MSG02.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = "Field is required";
        if (fieldError != null && fieldError.getDefaultMessage() != null) {
            message = fieldError.getDefaultMessage();
        }
        ApiResponse<Object> body = ApiResponse.error("MSG02", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}

