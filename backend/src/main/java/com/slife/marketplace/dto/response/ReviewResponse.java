package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Byte rating;
    private String comment;
    private Instant createdAt;
    
    // Thông tin người đánh giá
    private Long reviewerId;
    private String reviewerName;
    private String reviewerAvatar;
    
    // Thông tin sản phẩm liên quan
    private Long listingId;
    private String listingTitle;
    private BigDecimal listingPrice;
    private String listingImage;
}
