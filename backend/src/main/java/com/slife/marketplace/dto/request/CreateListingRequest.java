/**
 * Mục đích: DTO request CreateListingRequest
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.request;
import lombok.Data;
@Data public class CreateListingRequest { private String title; private String description; private Long categoryId; private java.math.BigDecimal price; private String condition; private Boolean isGiveaway; private String purpose; private Long pickupAddressId; }