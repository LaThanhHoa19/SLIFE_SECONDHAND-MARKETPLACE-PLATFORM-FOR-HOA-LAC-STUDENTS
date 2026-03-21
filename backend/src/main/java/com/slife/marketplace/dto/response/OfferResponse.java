package com.slife.marketplace.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class OfferResponse {
    private Long id;
    private Long listingId;
    private Long buyerId;
    private BigDecimal proposedPrice;
    private String message;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
