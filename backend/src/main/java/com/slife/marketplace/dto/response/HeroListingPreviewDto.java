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
public class HeroListingPreviewDto {
    private Long id;
    private String title;
    private BigDecimal price;
    private String thumbnailUrl;
    private Boolean isGiveaway;
}
