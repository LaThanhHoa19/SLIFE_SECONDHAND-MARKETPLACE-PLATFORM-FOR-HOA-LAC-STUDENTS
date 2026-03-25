package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateListingRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingCardResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.MyListingResponse;
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
     * PUT /api/listings/{id}
     * Cập nhật tin đăng (chỉ chủ tin).
     */
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            @PathVariable("id") Long id,
            @RequestBody CreateListingRequest request) {
        User seller = userService.getCurrentUser();
        ListingResponse response = listingService.updateListing(id, seller, request);
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
            @RequestParam(name = "sellerId", required = false) Long sellerId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        User viewer = userService.getCurrentUserOptional().orElse(null);
        PagedResponse<ListingCardResponse> listings =
                listingService.getActiveListingCards(page, size, viewer, sellerId);

        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }

    /**
     * GET /api/listings/my — Lấy danh sách tin đăng của user hiện tại.
     * ?status=ACTIVE|DRAFT|HIDDEN|SOLD|GIVEN_AWAY|BANNED|EXPIRED|REPORTED
     * Không truyền status → trả về tất cả.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PagedResponse<MyListingResponse>>> getMyListings(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        User currentUser = userService.getCurrentUser();
        PagedResponse<MyListingResponse> listings = listingService.getMyListings(status, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", listings));
    }

    /**
     * GET /api/listings/{id}
     * Chi tiết listing.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListing(@PathVariable("id") Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        User currentUser = userService.getCurrentUserOptional().orElse(null);
        boolean isSaved = currentUser != null && savedListingService.isSaved(currentUser.getId(), id);
        
        ListingResponse response = listingService.buildListingResponse(listing, currentUser, isSaved);

        return ResponseEntity.ok(ApiResponse.success("OK", response));
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
     * PATCH /api/listings/{id}/repost — Đăng lại tin đã hết hạn (status EXPIRED → ACTIVE, gia hạn 30 ngày).
     */
    @PatchMapping("/{id}/repost")
    public ResponseEntity<ApiResponse<Void>> repostListing(@PathVariable("id") Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.repostListing(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    /**
     * PATCH /api/listings/{id}/renew — Gia hạn tin (chỉ khi còn ≤ 7 ngày trước khi hết hạn).
     */
    @PatchMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<Void>> renewListing(@PathVariable("id") Long id) {
        User currentUser = userService.getCurrentUser();
        listingService.renewListing(id, currentUser);
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

    @GetMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@PathVariable("id") Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        User currentUser = userService.getCurrentUserOptional().orElse(null);
        boolean isSaved = currentUser != null && savedListingService.isSaved(currentUser.getId(), id);
        ListingResponse listingData = listingService.buildListingResponse(listing, currentUser, isSaved);

        Map<String, Object> data = new HashMap<>();
        data.put("shareUrl", frontendUrl + "/listings/" + listing.getId());
        data.put("listing", listingData);
        // Duy trì các field cũ để tránh break FE nếu đã dùng
        data.put("title", listing.getTitle());
        data.put("price", listing.getPrice());

        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

}