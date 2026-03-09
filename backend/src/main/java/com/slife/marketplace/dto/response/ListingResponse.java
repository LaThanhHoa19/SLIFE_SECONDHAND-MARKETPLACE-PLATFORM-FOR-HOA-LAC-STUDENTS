package com.slife.marketplace.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class ListingResponse {
    // Primary Identifiers
    private Long id;
    private Long sellerId;
    
    // Core Content
    private String title;
    private String description;
    private BigDecimal price;
    private Boolean isGiveaway; // From 'main' - specific business logic
    
    // Listing Attributes (From 'Hoa')
    private String condition;
    private String location;
    private String status;
    private Instant createdAt;
    private List<String> images;
    
    // User Context & Metadata
    private Object sellerSummary;
    private Boolean isOwnListing; // From 'main' - Helps UI show "Edit/Delete" buttons
    private Boolean isSaved;      // From 'Hoa' - Wishlist status
    private Boolean isFollowed;   // From 'Hoa' - Seller follow status
}