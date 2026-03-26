package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupAddressResponse {
    private String locationName;
    private String addressText;
    private BigDecimal lat;
    private BigDecimal lng;
}

