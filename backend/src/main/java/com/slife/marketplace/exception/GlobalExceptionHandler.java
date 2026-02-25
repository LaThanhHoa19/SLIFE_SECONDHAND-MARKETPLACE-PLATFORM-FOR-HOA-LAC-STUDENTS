/**
 * Mục đích: Global API errors
 * Endpoints liên quan: all
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.exception;
import com.slife.marketplace.dto.response.ApiErrorResponse;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import org.springframework.web.bind.MethodArgumentNotValidException;
@RestControllerAdvice public class GlobalExceptionHandler{ @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<ApiErrorResponse> v(MethodArgumentNotValidException e){ ApiErrorResponse r=new ApiErrorResponse(); r.setCode("VALIDATION_ERROR"); r.setMessage("Invalid input"); return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(r);} @ExceptionHandler(CustomException.class) public ResponseEntity<ApiErrorResponse> c(CustomException e){ ApiErrorResponse r=new ApiErrorResponse(); r.setCode("BUSINESS_ERROR"); r.setMessage(e.getMessage()); return ResponseEntity.badRequest().body(r);} }