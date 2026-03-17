package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.SavedListingService;
import com.slife.marketplace.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;
    private final UserService userService;
    private final ListingRepository listingRepository;
    private final SavedListingService savedListingService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public ListingController(ListingService listingService,
                             UserService userService,
                             ListingRepository listingRepository,
                             SavedListingService savedListingService) {
        this.listingService = listingService;
        this.userService = userService;
        this.listingRepository = listingRepository;
        this.savedListingService = savedListingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> getListings(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "q",        required = false) String q,
            @RequestParam(name = "sort",     defaultValue = "createdAt,desc") String sort,
            @RequestParam(name = "page",     defaultValue = "0") int page,
            @RequestParam(name = "size",     defaultValue = "10") int size) {

        User currentUser = userService.getCurrentUserOptional().orElse(null);
        PagedResponse<ListingResponse> listings = listingService.getFilteredListings(
                parseCategory(category), location, q, sort, page, size, currentUser);
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

    /**
     * GET /api/listings/{id}
     * Chi tiet listing (FE can cho trang detail).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getListing(@PathVariable("id") Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        User currentUser = userService.getCurrentUserOptional().orElse(null);

        Map<String, Object> data = new HashMap<>();
        data.put("id",           listing.getId());
        data.put("title",        listing.getTitle());
        data.put("description",  listing.getDescription());
        data.put("price",        listing.getPrice());
        data.put("condition",    listing.getItemCondition());
        data.put("purpose",      listing.getPurpose());
        data.put("status",       listing.getStatus());
        data.put("isGiveaway",   listing.getIsGiveaway());
        data.put("createdAt",    listing.getCreatedAt());

        if (listing.getPickupAddress() != null) {
            data.put("location", listing.getPickupAddress().getLocationName());
        }

        if (listing.getSeller() != null) {
            Map<String, Object> seller = new HashMap<>();
            seller.put("id",          listing.getSeller().getId());
            seller.put("fullName",     listing.getSeller().getFullName());
            seller.put("avatarUrl",    listing.getSeller().getAvatarUrl());
            seller.put("reputation",   listing.getSeller().getReputationScore());
            data.put("seller", seller);
        }

        data.put("images", listing.getImages().stream()
                .map(img -> img.getImageUrl()).toList());

        boolean isSaved = currentUser != null && savedListingService.isSaved(currentUser.getId(), id);
        data.put("isSaved",    isSaved);
        data.put("isFollowed", false);

        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /**
     * POST /api/listings/{id}/save — luu listing vao danh sach yeu thich (auth required).
     */
    @PostMapping("/{id}/save")
    public ResponseEntity<ApiResponse<Void>> saveListing(@PathVariable("id") Long id) {
        User user = userService.getCurrentUser();
        savedListingService.save(user, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * DELETE /api/listings/{id}/save — bo luu listing (auth required).
     */
    @DeleteMapping("/{id}/save")
    public ResponseEntity<ApiResponse<Void>> unsaveListing(@PathVariable("id") Long id) {
        User user = userService.getCurrentUser();
        savedListingService.unsave(user, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * DELETE /api/listings/{id}/draft — Xóa vĩnh viễn bản nháp (chỉ seller, chỉ khi status = DRAFT).
     */
    @DeleteMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable("id") Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.deleteDraft(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * PATCH /api/listings/{id}/hide — Ẩn tin (chỉ seller của listing mới được thực hiện).
     */
    @PatchMapping("/{id}/hide")
    public ResponseEntity<ApiResponse<Void>> hideListing(@PathVariable("id") Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.hideListing(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * PATCH /api/listings/{id}/unhide — Hiển thị lại tin đã ẩn (chỉ seller của listing mới được thực hiện).
     */
    @PatchMapping("/{id}/unhide")
    public ResponseEntity<ApiResponse<Void>> unhideListing(@PathVariable("id") Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.unhideListing(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * GET /api/listings/{id}/share
     * Tra ve share URL + metadata de FE render share card.
     */
    @GetMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@PathVariable("id") Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        String thumbnail = listing.getImages() != null && !listing.getImages().isEmpty()
                ? listing.getImages().get(0).getImageUrl() : null;

        Map<String, Object> data = new HashMap<>();
        data.put("shareUrl",    frontendUrl + "/listings/" + listing.getId());
        data.put("title",       listing.getTitle());
        data.put("description", listing.getDescription());
        data.put("price",       listing.getPrice());
        data.put("thumbnailUrl",thumbnail);
        data.put("purpose",     listing.getPurpose());
        data.put("condition",   listing.getItemCondition());

        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    private Long parseCategory(String category) {
        if (category == null || category.isBlank()) return null;
        try { return Long.parseLong(category.trim()); }
        catch (NumberFormatException ignored) { return null; }
    }
}