package com.slife.marketplace.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String condition;
    private String itemCondition;
    private String purpose;
    private String location;
    private java.time.Instant createdAt;
    private java.util.List<String> images;
    private Object sellerSummary;
    private Boolean isSaved;
    private Boolean isFollowed;
    private Long likeCount;
    private Boolean isLiked;
    private Boolean isGiveaway;
    /** Object chứa lat, lng, locationName, addressText của điểm hẹn (nếu có) */
    private Object pickupAddress;
    private Object category;
    private Object seller;
}