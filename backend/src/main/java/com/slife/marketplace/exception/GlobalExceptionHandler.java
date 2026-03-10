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
        response.setCode(ErrorCode.INVALID_INPUT.getCode());
        response.setMessage(ErrorCode.INVALID_INPUT.getMessage());
        response.setDetails(e.getBindingResult());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(SlifeException.class)
    public ResponseEntity<ApiErrorResponse> handleSlife(SlifeException e) {
        ErrorCode errorCode = e.getErrorCode();
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(errorCode.getCode());
        response.setMessage(e.getMessage());
        response.setDetails(e.getDetails());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception e) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.setCode(ErrorCode.INTERNAL_ERROR.getCode());
        response.setMessage(ErrorCode.INTERNAL_ERROR.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

