/**
 * Mục đích: DTO response DealResponse
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.response;
import lombok.Data;
@Data public class DealResponse { private Long id; private String status; private java.time.LocalDateTime pickupTime; }