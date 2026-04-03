package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Người bán chốt đơn trong chat: tạo deal PENDING cho người mua (proposed_by = buyer).
 */
@Getter
@Setter
public class SealDealRequest {

    @NotNull(message = "buyerId là bắt buộc")
    private Long buyerId;

    @NotNull(message = "Giá là bắt buộc")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải >= 0")
    private BigDecimal price;

    /** Thời gian nhận hàng (tuỳ chọn), ISO-8601 (vd từ {@code Date#toISOString()}). */
    private Instant pickupTime;
}
