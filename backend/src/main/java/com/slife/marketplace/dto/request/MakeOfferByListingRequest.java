package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MakeOfferByListingRequest {

    @NotNull(message = "listingId required")
    private Long listingId;

    @NotNull(message = "amount required")
    @DecimalMin(value = "0", inclusive = false, message = "Proposed price must be positive")
    private BigDecimal amount;
}
