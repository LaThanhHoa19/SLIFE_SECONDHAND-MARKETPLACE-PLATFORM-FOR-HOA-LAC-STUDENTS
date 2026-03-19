package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateOfferRequest {
    @NotNull(message = "proposed_price is required")
    @DecimalMin(value = "0", inclusive = false, message = "proposed_price must be positive")
    private BigDecimal proposedPrice;

    @Size(max = 1000, message = "message must not exceed 1000 characters")
    private String message;
}
