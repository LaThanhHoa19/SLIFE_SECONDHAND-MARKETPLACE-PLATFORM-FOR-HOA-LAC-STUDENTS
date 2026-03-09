package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.SearchRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingPageResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * SCRUM-43: Basic keyword search endpoint.
 */
@RestController
@RequestMapping("/api")
public class SearchController {

    private final ListingRepository listingRepository;
    private final UserService userService;

    public SearchController(ListingRepository listingRepository, UserService userService) {
        this.listingRepository = listingRepository;
        this.userService = userService;
    }

    /**
     * GET /api/search
     * Query params: q, categoryId, location, page, size.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<ListingPageResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        SearchRequest request = new SearchRequest();
        request.setQ(q);
        request.setCategoryId(categoryId);
        request.setLocation(location);
        request.setPage(page);
        request.setSize(size);

        int pageIndex = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        int pageSize = request.getSize() != null && request.getSize() > 0 ? Math.min(request.getSize(), 50) : 10;

        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String keyword = request.getQ();
        String normalizedQ = (keyword == null || keyword.isBlank()) ? null : keyword.trim().toLowerCase();
        String normalizedLocation = (request.getLocation() == null || request.getLocation().isBlank())
                ? null
                : request.getLocation().trim();

        Page<Listing> pageResult = listingRepository.findByFilters(
                normalizedQ,
                request.getCategoryId(),
                normalizedLocation,
                pageable
        );

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
