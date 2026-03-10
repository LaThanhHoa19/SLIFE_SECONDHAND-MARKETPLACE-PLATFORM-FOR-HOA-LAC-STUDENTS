package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User currentUser = userService.getCurrentUserOptional().orElse(null);
        PagedResponse<ListingResponse> listings = listingService.getFilteredListings(category, location, q, sort, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }
}