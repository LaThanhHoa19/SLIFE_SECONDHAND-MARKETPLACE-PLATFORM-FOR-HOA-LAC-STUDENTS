package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ListingLikeService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class ListingLikeController {

    private final ListingLikeService listingLikeService;
    private final UserService userService;

    public ListingLikeController(ListingLikeService listingLikeService, UserService userService) {
        this.listingLikeService = listingLikeService;
        this.userService = userService;
    }

    /**
     * GET /api/me/liked-listings — danh sach listing da like cua user (auth required).
     */
    @GetMapping("/liked-listings")
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> getLikedListings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        User user = userService.getCurrentUser();
        PagedResponse<ListingResponse> result = listingLikeService.getLikedListings(user, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }
}
