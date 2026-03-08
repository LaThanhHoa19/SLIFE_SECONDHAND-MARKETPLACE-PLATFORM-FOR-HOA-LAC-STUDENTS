/**
 * Mục đích: Controller Listing
 * Endpoints liên quan: api
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
public class ListingController {

    private final ListingService listingService;
    private final UserService userService;

    public ListingController(ListingService listingService, UserService userService) {
        this.listingService = listingService;
        this.userService = userService;
    }

    @PostMapping("/api/listings")
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(@RequestBody CreateListingRequest request) {
        User currentUser = userService.getCurrentUser();
        Listing created = listingService.createListing(currentUser, request);
        ListingResponse response = listingService.toResponse(created);
        return ResponseEntity.ok(ApiResponse.success("Tạo tin thành công", response));
    }

    @GetMapping("/api/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getListings(
            @RequestParam(required = false) Long category) {
        List<ListingResponse> listings = listingService.getListings(category);
        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }

    @GetMapping("/api/listings/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListingDetail(@PathVariable Long id) {
        ListingResponse listing = listingService.getListingById(id);
        return ResponseEntity.ok(ApiResponse.success("OK", listing));
    }

    @PostMapping(value = "/api/listings/{id}/images", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Void>> uploadListingImages(
            @PathVariable Long id,
            HttpServletRequest request) {
        User currentUser = userService.getCurrentUser();
        List<MultipartFile> files = new ArrayList<>();
        if (request instanceof MultipartHttpServletRequest multipartRequest) {
            multipartRequest.getMultiFileMap().getOrDefault("images", Collections.emptyList()).forEach(files::add);
        }
        listingService.uploadListingImages(id, currentUser, files);
        return ResponseEntity.ok(ApiResponse.success("Đã tải ảnh lên", null));
    }

    @PostMapping("/api/listings/{id}/report")
    public ResponseEntity<ApiResponse<Void>> reportListing(
            @PathVariable Long id,
            @RequestBody Object r
    ) {
        return ResponseEntity.ok(ApiResponse.success("Report listing stub", null));
    }
}
