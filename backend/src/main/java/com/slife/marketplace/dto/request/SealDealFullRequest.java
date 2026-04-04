package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Chốt đơn (seller-seal) — dùng path phẳng {@code POST /api/deals/seller-seal} để tránh proxy/gateway
 * xử lý sai đường dẫn lồng {@code /api/listings/{id}/deals/seal}.
 */
@Getter
@Setter
public class SealDealFullRequest {

    @NotNull(message = "listingId là bắt buộc")
    private Long listingId;

    @NotNull(message = "buyerId là bắt buộc")
    private Long buyerId;

    @NotNull(message = "Giá là bắt buộc")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải >= 0")
    private BigDecimal price;

    private Instant pickupTime;

    /** Tuỳ chọn: tham chiếu {@code offers.offer_id}. */
    private Long offerId;

    /** Tuỳ chọn: địa chỉ giao; mặc định {@code listing.pickup_address_id}. */
    private Long addressId;
}
