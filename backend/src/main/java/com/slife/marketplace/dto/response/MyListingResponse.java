package com.slife.marketplace.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Response DTO for the "My Listings" management page.
 * Includes all fields needed to display a listing in the seller's dashboard
 * (status, purpose, expiry, category) on top of the public listing fields.
 */
@Data
public class MyListingResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String condition;
    private String location;
    private Instant createdAt;
    private Instant updatedAt;
    private List<String> images;

    // Management-specific fields
    private String status;
    private String purpose;
    private Boolean isGiveaway;
    private Instant expirationDate;
    private String categoryName;
    private long reportCount;
}
