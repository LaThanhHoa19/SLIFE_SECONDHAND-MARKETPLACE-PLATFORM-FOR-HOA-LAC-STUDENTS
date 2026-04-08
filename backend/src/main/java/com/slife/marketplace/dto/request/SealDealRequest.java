package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    /** Tuỳ chọn: tham chiếu {@code offers.offer_id} khi giá khớp lượt trả giá trong chat. */
    private Long offerId;

    /** Tuỳ chọn: địa chỉ giao; mặc định địa chỉ nhận của tin ({@code pickup_address_id}). */
    private Long addressId;

    /**
     * Văn bản địa điểm nhận hàng người bán nhập khi chốt đơn (chat).
     * Nếu khác với địa chỉ mặc định của tin, backend tạo {@link com.slife.marketplace.entity.Address} mới cho người bán và gắn vào deal.
     */
    @Size(max = 4000, message = "Địa điểm nhận hàng quá dài")
    private String pickupLocationText;
}
