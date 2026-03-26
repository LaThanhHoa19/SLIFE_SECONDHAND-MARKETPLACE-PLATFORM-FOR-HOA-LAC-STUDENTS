package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateOfferRequest;
import com.slife.marketplace.dto.request.MakeOfferRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.OfferResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.Offer;
import com.slife.marketplace.service.OfferService;
import com.slife.marketplace.util.Constants;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    /**
     * v1: Propose a price negotiation (UC-30).
     */
    @PostMapping("/api/v1/offers/make")
    public ResponseEntity<ApiResponse<Offer>> makeOffer(@Valid @RequestBody MakeOfferRequest request) {
        Offer offer = offerService.makeOffer(request);
        return ResponseEntity.ok(ApiResponse.success(Constants.MSG10, offer));
    }

    @PostMapping("/api/listings/{id}/offers")
    public ResponseEntity<ApiResponse<OfferResponse>> createListingOffer(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateOfferRequest request) {
        OfferResponse offer = offerService.createOfferForListing(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Constants.MSG10, offer));
    }

    @GetMapping("/api/offers/history")
    public ResponseEntity<ApiResponse<PagedResponse<OfferResponse>>> getOfferHistory(
            @RequestParam(name = "listingId", required = false) Long listingId,
            @RequestParam(name = "buyerId", required = false) Long buyerId,
            @RequestParam(name = "sessionId", required = false) String sessionId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        PagedResponse<OfferResponse> data = offerService.getOfferHistory(listingId, buyerId, sessionId, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @GetMapping("/api/listings/{id}/offers")
    public ResponseEntity<?> m2(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/offers/{id}/accept")
    public ResponseEntity<?> m3(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/offers/{id}/reject")
    public ResponseEntity<?> m4(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }
}