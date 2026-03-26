package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.SavedListingService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class SavedListingController {

    private final SavedListingService savedListingService;
    private final UserService userService;

    public SavedListingController(SavedListingService savedListingService, UserService userService) {
        this.savedListingService = savedListingService;
        this.userService = userService;
    }

    /**
     * GET /api/me/saved-listings — danh sach listing da luu cua user (auth required).
     */
    @GetMapping("/saved-listings")
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> getSavedListings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        User user = userService.getCurrentUser();
        PagedResponse<ListingResponse> result = savedListingService.getSavedListings(user, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }
}
