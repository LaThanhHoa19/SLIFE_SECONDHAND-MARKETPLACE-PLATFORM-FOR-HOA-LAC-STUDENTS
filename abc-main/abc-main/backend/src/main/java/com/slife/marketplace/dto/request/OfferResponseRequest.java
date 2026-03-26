package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OfferResponseRequest {

    @NotNull(message = "action required: ACCEPTED or REJECTED")
    private String action; // "ACCEPTED" or "REJECTED"
}
