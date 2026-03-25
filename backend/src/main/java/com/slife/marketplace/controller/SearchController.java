// backend/src/main/java/com/slife/marketplace/controller/SearchController.java
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.FollowService;
import com.slife.marketplace.service.SearchService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.AddressFormat;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SearchController {

    private final SearchService searchService;
    private final UserService userService;
    private final FollowService followService;

    public SearchController(SearchService searchService,
            UserService userService,
            FollowService followService) {
        this.searchService = searchService;
        this.userService = userService;
        this.followService = followService;
    }

    @GetMapping("/search")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> search(@Valid SearchRequest request) {
        Page<Listing> pageResult = searchService.search(request);

        Optional<User> viewer = userService.getCurrentUserOptional();
        Set<Long> followedSellerIds = resolveFollowedSellerIds(viewer.orElse(null), pageResult.getContent());

        List<ListingResponse> content = pageResult.getContent().stream()
                .map(listing -> toListingResponse(listing, viewer.orElse(null), followedSellerIds))
                .toList();

        PagedResponse<ListingResponse> body = new PagedResponse<>();
        body.setContent(content);
        body.setTotalElements(pageResult.getTotalElements());
        body.setTotalPages(pageResult.getTotalPages());
        body.setPage(pageResult.getNumber());
        body.setSize(pageResult.getSize());

        return ResponseEntity.ok(ApiResponse.success("OK", body));
    }

    private Set<Long> resolveFollowedSellerIds(User viewer, List<Listing> listings) {
        if (viewer == null || listings == null || listings.isEmpty()) {
            return Set.of();
        }
        Set<Long> sellerIds = listings.stream()
                .map(l -> l.getSeller() != null ? l.getSeller().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (sellerIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(followService.findFollowedIdsAmong(viewer.getId(), sellerIds));
    }

    private ListingResponse toListingResponse(Listing listing, User viewer, Set<Long> followedSellerIds) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());
        res.setDescription(listing.getDescription());
        res.setPrice(listing.getPrice());
        res.setCondition(listing.getItemCondition());
        res.setPurpose(listing.getPurpose());
        res.setCreatedAt(listing.getCreatedAt());

        if (listing.getPickupAddress() != null) {
            var pa = listing.getPickupAddress();
            res.setLocation(AddressFormat.pickupDisplayLine(pa.getLocationName(), pa.getAddressText()));
        }

        Map<String, Object> sellerSummary = new HashMap<>();
        if (listing.getSeller() != null) {
            sellerSummary.put("userId", listing.getSeller().getId());
            sellerSummary.put("fullName", listing.getSeller().getFullName());
            sellerSummary.put("avatarUrl", listing.getSeller().getAvatarUrl());
            sellerSummary.put("reputation", listing.getSeller().getReputationScore());
        }
        res.setSellerSummary(sellerSummary);

        res.setImages(listing.getImages().stream()
                .map(img -> img.getImageUrl())
                .toList());
        res.setIsSaved(false);

        boolean isFollowed = false;
        if (viewer != null && listing.getSeller() != null
                && !listing.getSeller().getId().equals(viewer.getId())) {
            isFollowed = followedSellerIds.contains(listing.getSeller().getId());
        }
        res.setIsFollowed(isFollowed);

        return res;
    }
}