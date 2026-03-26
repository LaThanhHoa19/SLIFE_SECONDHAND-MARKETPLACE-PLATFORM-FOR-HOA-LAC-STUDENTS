package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmDealRequest {

    @NotNull
    private Long dealId;
}
