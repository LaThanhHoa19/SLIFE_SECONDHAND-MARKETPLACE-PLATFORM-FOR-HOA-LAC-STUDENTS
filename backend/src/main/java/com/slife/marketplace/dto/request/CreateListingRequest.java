package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
public class CreateListingRequest {

    /**
     * Nếu isDraft = true: các trường bắt buộc (title, categoryId, price) được bỏ qua validation Bean.
     * Service sẽ điền giá trị mặc định nếu thiếu.
     * Nếu isDraft = false (đăng tin thật): service sẽ validate lại và throw lỗi nếu thiếu.
     */
    private Boolean isDraft;

    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    private String description;

    private Long categoryId;

    private BigDecimal price;

    private String condition;

    private Boolean isGiveaway;

    private String purpose;

    private Long pickupAddressId;

    private String pickupLocationName;

    private String pickupAddressText;

    private BigDecimal pickupLat;
    private BigDecimal pickupLng;

    public boolean isDraftMode() {
        return Boolean.TRUE.equals(isDraft);
    }

    public BigDecimal normalizedPrice() {
        return price != null ? price.setScale(2, RoundingMode.HALF_UP) : null;
    }
}
