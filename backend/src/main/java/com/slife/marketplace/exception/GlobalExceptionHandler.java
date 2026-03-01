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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode("VALIDATION_ERROR");
        response.setMessage("Invalid input");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiErrorResponse> handleCustom(CustomException e) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode("BUSINESS_ERROR");
        response.setMessage(e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}
