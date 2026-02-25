/**
 * Mục đích: DTO response ApiErrorResponse
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.response;
import lombok.Data;
@Data public class ApiErrorResponse { private String code; private String message; private Object details; }