package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MakeOfferRequest {

    @NotNull(message = "amount required")
    @DecimalMin(value = "0", inclusive = false, message = "Offer price must be positive")
    private BigDecimal amount;
}
