/**
 * Mục đích: Controller Listing
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.service.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping("/api/listings")
    public ResponseEntity<ApiResponse<Void>> createListing(@RequestBody Object r) {
        // Chưa triển khai, chỉ stub để compile
        return ResponseEntity.ok(ApiResponse.success("Create listing stub", null));
    }

    @GetMapping("/api/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getListings() {
        List<ListingResponse> listings = listingService.getAllListingsForTest();
        return ResponseEntity.ok(ApiResponse.success("Listings fetched", listings));
    }

    @GetMapping("/api/listings/{id}")
    public ResponseEntity<ApiResponse<Void>> getListingDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Listing detail stub", null));
    }

    @PostMapping("/api/listings/{id}/report")
    public ResponseEntity<ApiResponse<Void>> reportListing(
            @PathVariable Long id,
            @RequestBody Object r
    ) {
        return ResponseEntity.ok(ApiResponse.success("Report listing stub", null));
    }
}
