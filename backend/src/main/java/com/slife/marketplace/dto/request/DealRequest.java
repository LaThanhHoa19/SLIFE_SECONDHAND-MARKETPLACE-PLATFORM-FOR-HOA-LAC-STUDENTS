package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DealRequest {
    @NotNull(message = "Giá là bắt buộc")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    /** Tuỳ chọn: liên kết deal với một lượt trả giá PENDING đã có (cùng listing + người mua + giá). */
    private Long offerId;

    /** Tuỳ chọn: địa chỉ giao hàng; phải thuộc người bán. Bỏ qua thì dùng {@code listing.pickup_address_id} nếu có. */
    private Long addressId;
}
