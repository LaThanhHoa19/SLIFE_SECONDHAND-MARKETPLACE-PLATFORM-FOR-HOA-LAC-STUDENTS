package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MakeOfferRequest {

    @NotNull
    private String sessionId;

    @NotNull
    private Long listingId;

    @NotNull
    @DecimalMin(value = "0", inclusive = false, message = "Proposed price must be positive")
    private BigDecimal proposedPrice;
}
