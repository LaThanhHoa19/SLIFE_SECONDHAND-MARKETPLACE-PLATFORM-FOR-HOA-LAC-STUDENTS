package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingPageResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.service.SearchService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * SCRUM-43: Basic keyword search endpoint.
 */
@RestController
@RequestMapping("/api")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * GET /api/search
     * Query params: q, categoryId, location, page, size.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<ListingPageResponse>> search(@Valid SearchRequest request) {
        Page<Listing> pageResult = searchService.search(request);

        if (pageResult.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("MSG01", "No search results"));
        }

        List<ListingResponse> content = pageResult.getContent().stream()
                .map(this::toListingResponse)
                .toList();

        ListingPageResponse body = new ListingPageResponse();
        body.setContent(content);
        body.setTotalElements(pageResult.getTotalElements());
        body.setTotalPages(pageResult.getTotalPages());
        body.setPage(pageResult.getNumber());
        body.setSize(pageResult.getSize());

        return ResponseEntity.ok(ApiResponse.success("OK", body));
    }

    private ListingResponse toListingResponse(Listing listing) {
        ListingResponse res = new ListingResponse();
        res.setId(listing.getId());
        res.setTitle(listing.getTitle());

        // Optional richer mapping – safe defaults
        java.util.Map<String, Object> sellerSummary = new java.util.HashMap<>();
        if (listing.getSeller() != null) {
            sellerSummary.put("fullName", listing.getSeller().getFullName());
            sellerSummary.put("avatarUrl", listing.getSeller().getAvatarUrl());
            sellerSummary.put("reputation", listing.getSeller().getReputationScore());
        }
        res.setSellerSummary(sellerSummary);

        res.setImages(java.util.List.of()); // Images not part of SCRUM-43 scope

        res.setIsSaved(false);
        res.setIsFollowed(false);

        return res;
    }
}
