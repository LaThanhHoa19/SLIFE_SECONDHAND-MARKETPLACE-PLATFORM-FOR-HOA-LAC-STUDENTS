package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.HeroListingPreviewDto;
import com.slife.marketplace.dto.response.LandingResponse;
import com.slife.marketplace.dto.response.LandingTotalsDto;
import com.slife.marketplace.dto.response.ListingCardResponse;
import com.slife.marketplace.repository.DealRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class LandingService {

    private static final int RECENT_SIZE = 12;
    private static final int TOP_CATEGORIES = 5;
    private static final long CACHE_TTL_MS = 90_000L;

    private final ListingService listingService;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final DealRepository dealRepository;

    private final AtomicReference<LandingResponse> cache = new AtomicReference<>();
    private volatile long cacheExpiresAtMs;

    public LandingService(
            ListingService listingService,
            ListingRepository listingRepository,
            UserRepository userRepository,
            DealRepository dealRepository) {
        this.listingService = listingService;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.dealRepository = dealRepository;
    }

    public LandingResponse getLandingPayload() {
        long now = System.currentTimeMillis();
        LandingResponse hit = cache.get();
        if (hit != null && now < cacheExpiresAtMs) {
            return hit;
        }
        synchronized (this) {
            now = System.currentTimeMillis();
            hit = cache.get();
            if (hit != null && now < cacheExpiresAtMs) {
                return hit;
            }
            LandingResponse built = build();
            cache.set(built);
            cacheExpiresAtMs = System.currentTimeMillis() + CACHE_TTL_MS;
            return built;
        }
    }

    private LandingResponse build() {
        var page = listingService.getActiveListingCards(0, RECENT_SIZE, null, null, false, "NEWEST", null);
        List<ListingCardResponse> recent = page.getContent() != null
                ? List.copyOf(page.getContent())
                : List.of();

        HeroListingPreviewDto hero = null;
        if (!recent.isEmpty()) {
            ListingCardResponse first = recent.get(0);
            hero = HeroListingPreviewDto.builder()
                    .id(first.getId())
                    .title(first.getTitle())
                    .price(first.getPrice())
                    .thumbnailUrl(first.getThumbnailUrl())
                    .isGiveaway(first.getIsGiveaway())
                    .build();
        }

        var categoryStats = listingRepository.findTopCategoryStatsByActiveListings(
                Instant.now(),
                PageRequest.of(0, TOP_CATEGORIES));

        long activeListings = listingRepository.countByStatus("ACTIVE");
        long users = userRepository.countByStatus("ACTIVE");
        long completedDeals = dealRepository.countByStatusAndDeletedAtIsNull("COMPLETED");
        BigDecimal avgRep = userRepository.averageReputationScoreForActiveUsers();
        if (avgRep != null) {
            avgRep = avgRep.setScale(2, RoundingMode.HALF_UP);
        }

        LandingTotalsDto totals = LandingTotalsDto.builder()
                .activeListings(activeListings)
                .registeredUsers(users)
                .completedDeals(completedDeals)
                .averageReputation(avgRep)
                .build();

        return LandingResponse.builder()
                .recentListings(recent.isEmpty() ? Collections.emptyList() : recent)
                .heroListing(hero)
                .categoryStats(categoryStats != null ? categoryStats : List.of())
                .totals(totals)
                .build();
    }
}
