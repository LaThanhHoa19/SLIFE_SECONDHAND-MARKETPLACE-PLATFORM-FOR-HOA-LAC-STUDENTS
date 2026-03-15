package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealResponse {
    private Long dealId;
    private Long listingId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal price;
    private String status;
    private LocalDateTime createdAt;
}