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
import java.math.BigDecimal;
import java.util.List;

@Data
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private Boolean isGiveaway;
    private String status;
    private List<String> images;
    private Long sellerId;
    private Object sellerSummary;
    /** True nếu user hiện tại là chủ tin (so sánh id hoặc email). */
    private Boolean isOwnListing;
    private Boolean isSaved;
    private Boolean isFollowed;
}