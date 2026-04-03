package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealResponse {
    private Long dealId;
    /** Tham chiếu {@code offers.offer_id} nếu giá bắt nguồn từ lượt trả giá. */
    private Long offerId;
    /** Tham chiếu {@code addresses.address_id} (điểm giao). */
    private Long addressId;
    private Long listingId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal price;
    private String status;
    private LocalDateTime confirmedAt;
    private LocalDateTime pickupTime;
    private Boolean reminderSent;
    private LocalDateTime createdAt;
}