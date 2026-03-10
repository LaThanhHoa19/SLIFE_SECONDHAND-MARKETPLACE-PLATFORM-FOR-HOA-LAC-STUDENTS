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

    @PostMapping
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(@RequestBody CreateListingRequest request) {
        User currentUser = userService.getCurrentUser();
        Listing created = listingService.createListing(currentUser, request);
        ListingResponse response = listingService.toResponse(created, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Tạo tin thành công", response));
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListingDetail(@PathVariable Long id) {
        User currentUser = userService.getCurrentUserOptional().orElse(null);
        ListingResponse listing = listingService.getListingById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", listing));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(@PathVariable Long id, @RequestBody CreateListingRequest request) {
        User currentUser = userService.getCurrentUser();
        Listing updated = listingService.updateListing(id, currentUser, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", listingService.toResponse(updated, currentUser)));
    }

    @PutMapping("/{id}/hide")
    public ResponseEntity<ApiResponse<Void>> hideListing(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.hideListing(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Đã ẩn tin", null));
    }

    @PutMapping("/{id}/sold")
    public ResponseEntity<ApiResponse<Void>> markAsSold(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.markAsSold(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã bán", null));
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
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

    @PostMapping("/{id}/report")
    public ResponseEntity<ApiResponse<Void>> reportListing(
            @PathVariable Long id,
            @RequestBody Object reportRequest
    ) {
        User currentUser = userService.getCurrentUser();
        listingService.reportListing(id, currentUser, reportRequest);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi báo cáo", null));
    }
}