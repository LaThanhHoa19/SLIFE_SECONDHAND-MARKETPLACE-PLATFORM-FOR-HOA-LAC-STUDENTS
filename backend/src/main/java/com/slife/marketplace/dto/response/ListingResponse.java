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
    private java.util.List<String> images;
    private Object sellerSummary;
    private Boolean isOwnListing; // From 'main' - Helps UI show "Edit/Delete" buttons
    private Boolean isSaved;      // From 'Hoa' - Wishlist status
    private Boolean isFollowed;   // From 'Hoa' - Seller follow status
}