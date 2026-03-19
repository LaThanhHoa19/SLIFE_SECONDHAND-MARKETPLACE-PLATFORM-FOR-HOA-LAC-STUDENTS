package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingCardResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.service.ListingService;
import com.slife.marketplace.service.ListingImageService;
import com.slife.marketplace.service.SavedListingService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.util.AddressFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
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
    private final ListingImageService listingImageService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public ListingController(ListingService listingService,
                             UserService userService,
                             ListingRepository listingRepository,
                             SavedListingService savedListingService,
                             ListingImageService listingImageService) {
        this.listingService = listingService;
        this.userService = userService;
        this.listingRepository = listingRepository;
        this.savedListingService = savedListingService;
        this.listingImageService = listingImageService;
    }

    /**
     * POST /api/listings
     * Tạo listing mới cho seller hiện tại.
     * Payload: multipart/form-data với:
     *  - payload: JSON CreateListingRequest
     *  - images: (optional) danh sách file ảnh (hiện BE mới lưu meta listing + address;
     *            flow upload ảnh listing chi tiết có thể bổ sung sau).
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<com.slife.marketplace.dto.response.ListingResponse>> createListingJson(
            @RequestBody CreateListingRequest request) {
        User seller = userService.getCurrentUser();
        var response = listingService.createListing(seller, request);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * POST /api/listings/{id}/images
     * Upload danh sách ảnh cho listing đã tồn tại.
     * Body: multipart/form-data với images[].
     */
    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> uploadListingImages(
            @PathVariable("id") Long id,
            @RequestPart("images") java.util.List<org.springframework.web.multipart.MultipartFile> images) {
        listingImageService.uploadListingImages(id, images);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ListingCardResponse>>> getListings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        PagedResponse<ListingCardResponse> listings = 
            listingService.getActiveListingCards(page, size);
            
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
        data.put("id", listing.getId());
        data.put("title", listing.getTitle());
        data.put("description", listing.getDescription());
        data.put("price", listing.getPrice());
        data.put("condition", listing.getItemCondition());
        data.put("purpose", listing.getPurpose());
        data.put("status", listing.getStatus());
        data.put("isGiveaway", listing.getIsGiveaway());
        data.put("createdAt", listing.getCreatedAt());

        if (listing.getPickupAddress() != null) {
            var pa = listing.getPickupAddress();
            data.put("location", AddressFormat.pickupDisplayLine(pa.getLocationName(), pa.getAddressText()));
            Map<String, Object> pickup = new HashMap<>();
            pickup.put("locationName", pa.getLocationName());
            pickup.put("addressText", pa.getAddressText());
            pickup.put("lat", pa.getLat());
            pickup.put("lng", pa.getLng());
            data.put("pickupAddress", pickup);
        }

        if (listing.getSeller() != null) {
            Map<String, Object> seller = new HashMap<>();
            seller.put("id", listing.getSeller().getId());
            seller.put("fullName", listing.getSeller().getFullName());
            seller.put("avatarUrl", listing.getSeller().getAvatarUrl());
            seller.put("reputation", listing.getSeller().getReputationScore());
            data.put("seller", seller);
        }

        data.put("images", listing.getImages().stream()
                .map(img -> img.getImageUrl()).toList());

        boolean isSaved = currentUser != null && savedListingService.isSaved(currentUser.getId(), id);
        data.put("isSaved", isSaved);
        data.put("isFollowed", false);

        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /**
     * POST /api/listings/{id}/save — luu listing vao danh sach yeu thich (auth
     * required).
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
     * GET /api/listings/{id}/share
     * Tra ve share URL + metadata de FE render share card.
     */
    @GetMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@PathVariable("id") Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        String thumbnail = listing.getImages() != null && !listing.getImages().isEmpty()
                ? listing.getImages().get(0).getImageUrl()
                : null;

        Map<String, Object> data = new HashMap<>();
        data.put("shareUrl", frontendUrl + "/listings/" + listing.getId());
        data.put("title", listing.getTitle());
        data.put("description", listing.getDescription());
        data.put("price", listing.getPrice());
        data.put("thumbnailUrl", thumbnail);
        data.put("purpose", listing.getPurpose());
        data.put("condition", listing.getItemCondition());

        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

}