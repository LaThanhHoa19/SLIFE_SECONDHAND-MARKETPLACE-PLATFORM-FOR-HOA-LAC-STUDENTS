package com.slife.marketplace.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealResponse {
    @JsonProperty("dealId")
    private Long dealId;
    
    @JsonProperty("offerId")
    private Long offerId;
    
    @JsonProperty("addressId")
    private Long addressId;
    
    @JsonProperty("listingId")
    private Long listingId;
    
    @JsonProperty("buyerId")
    private Long buyerId;
    
    @JsonProperty("sellerId")
    private Long sellerId;
    
    @JsonProperty("price")
    private BigDecimal price;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("confirmedAt")
    private LocalDateTime confirmedAt;
    
    @JsonProperty("pickupTime")
    private LocalDateTime pickupTime;
    
    @JsonProperty("reminderSent")
    private Boolean reminderSent;
    
    @JsonProperty("listingTitle")
    private String listingTitle;
    
    @JsonProperty("listingImage")
    private String listingImage;
    
    @JsonProperty("sellerName")
    private String sellerName;
    
    @JsonProperty("sellerAvatar")
    private String sellerAvatar;
    
    @JsonProperty("isReviewed")
    private boolean isReviewed;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Thời hạn cuối buyer có thể đánh giá = thời điểm deal SUCCESS + 7 ngày.
     * Chỉ có giá trị khi status = SUCCESS và chưa đánh giá.
     * null nếu deal chưa SUCCESS hoặc đã hết hạn (hoặc đã review).
     */
    @JsonProperty("reviewDeadline")
    private LocalDateTime reviewDeadline;
}