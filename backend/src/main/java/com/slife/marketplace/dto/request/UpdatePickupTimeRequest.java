package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * {@code pickupTime} là giờ địa phương Việt Nam (cùng quy ước với cột {@code deals.pickup_time}).
 */
@Data
public class UpdatePickupTimeRequest {
    @NotNull
    private LocalDateTime pickupTime;
}
