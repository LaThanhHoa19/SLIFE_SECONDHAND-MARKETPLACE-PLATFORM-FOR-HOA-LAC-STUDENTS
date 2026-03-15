package com.slife.marketplace.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private java.math.BigDecimal price;
    private String condition;
    private String purpose;
    private String location;
    private java.time.Instant createdAt;
    private java.util.List<String> images;
    private Object sellerSummary;
    private Boolean isSaved;
    private Boolean isFollowed;
}