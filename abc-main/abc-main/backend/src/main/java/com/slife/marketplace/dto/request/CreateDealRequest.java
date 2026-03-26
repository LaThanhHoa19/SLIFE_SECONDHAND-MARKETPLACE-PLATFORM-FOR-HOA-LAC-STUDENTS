/**
 * Mục đích: DTO request CreateDealRequest
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.request;
import lombok.Data;
@Data public class CreateDealRequest { private Long listingId; private Long buyerId; private Long pickupAddressId; private java.time.LocalDateTime pickupTime; }