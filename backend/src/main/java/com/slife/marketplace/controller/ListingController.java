package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;
    private final UserService userService;

    public ListingController(ListingService listingService, UserService userService) {
        this.listingService = listingService;
        this.userService = userService;
    }


    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> getListings(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User currentUser = userService.getCurrentUserOptional().orElse(null);
        PagedResponse<ListingResponse> listings = listingService.getFilteredListings(
                parseCategory(category),
                location,
                q,
                sort,
                page,
                size,
                currentUser
        );
        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }

    /**
     * GET /api/listings/my — Lấy danh sách tin đăng của user hiện tại.
     * ?status=ACTIVE|DRAFT|HIDDEN|SOLD|GIVEN_AWAY|BANNED|EXPIRED|REPORTED
     * Không truyền status → trả về tất cả.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PagedResponse<MyListingResponse>>> getMyListings(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User currentUser = userService.getCurrentUser();
        PagedResponse<MyListingResponse> listings = listingService.getMyListings(status, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }

    private Long parseCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(category.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}