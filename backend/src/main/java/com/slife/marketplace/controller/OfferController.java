package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.service.OfferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Legacy offer endpoints (stubs kept for API compatibility).
 * New offer flow: POST /api/v1/chats/{sessionId}/offer (ChatController).
 */
@RestController
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @PostMapping("/api/listings/{id}/offers")
    public ResponseEntity<ApiResponse<Void>> createOffer(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Use /api/v1/chats/{sessionId}/offer", null));
    }

    @GetMapping("/api/listings/{id}/offers")
    public ResponseEntity<ApiResponse<Void>> listOffers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PutMapping("/api/offers/{id}/accept")
    public ResponseEntity<ApiResponse<Void>> accept(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Use /api/v1/chats/offers/{offerId}/respond", null));
    }

    @PutMapping("/api/offers/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Use /api/v1/chats/offers/{offerId}/respond", null));
    }
}
