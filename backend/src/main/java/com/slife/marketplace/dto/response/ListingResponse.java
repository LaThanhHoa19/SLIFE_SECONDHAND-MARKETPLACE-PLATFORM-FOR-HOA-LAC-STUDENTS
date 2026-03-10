/**
 * Mục đích: DTO response ListingResponse
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.response;
import lombok.Data;
@Data public class ListingResponse { private Long id; private String title; private java.util.List<String> images; private Object sellerSummary; private Boolean isSaved; private Boolean isFollowed; }