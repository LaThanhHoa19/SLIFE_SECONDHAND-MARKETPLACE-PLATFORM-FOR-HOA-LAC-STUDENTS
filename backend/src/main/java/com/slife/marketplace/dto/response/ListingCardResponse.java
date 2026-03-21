package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingCardResponse {
    private Long id;
    private String title;
    private BigDecimal price;
    private String location;
    private String status;
    private String thumbnailUrl;

    // Thông tin người bán để hiển thị trên feed
    private Long sellerId;
    private String sellerName;
    private String sellerAvatarUrl;
    private java.time.Instant createdAt;
}
