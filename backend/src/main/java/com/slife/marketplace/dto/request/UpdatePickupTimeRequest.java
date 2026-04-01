package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdatePickupTimeRequest {
    @NotNull
    private LocalDateTime pickupTime;
}
