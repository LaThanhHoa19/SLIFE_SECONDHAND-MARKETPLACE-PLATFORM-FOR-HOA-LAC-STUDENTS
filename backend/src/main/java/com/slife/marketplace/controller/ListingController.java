/**
 * Mục đích: Controller Listing
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ListingResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.service.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ListingController {
    // TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    // TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
    @PostMapping("/api/listings")
    public ResponseEntity<?> m1(@RequestBody Object r) {/* Example */
        return ResponseEntity.ok().build();
    }

    @GetMapping({"/api/listings", "/api/listing"})
    public ResponseEntity<PagedResponse<ListingResponse>> m2(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(listingService.getListings(page, size));
    }

    @GetMapping("/api/listings/{id}")
    public ResponseEntity<?> m3(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/listings/{id}")
    public ResponseEntity<?> m4(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/listings/{id}/hide")
    public ResponseEntity<?> m5(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/listings/{id}/sold")
    public ResponseEntity<?> m6(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/listings/{id}/report")
    public ResponseEntity<?> m7(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/listings/{id}/images")
    public ResponseEntity<?> m8(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }
}