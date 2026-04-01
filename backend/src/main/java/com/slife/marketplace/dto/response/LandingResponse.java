package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingResponse {
    private List<ListingCardResponse> recentListings;
    private HeroListingPreviewDto heroListing;
    private List<CategoryStatDto> categoryStats;
    private LandingTotalsDto totals;
}
