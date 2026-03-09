package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.ConfirmDealRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.entity.Deal;
import com.slife.marketplace.service.DealService;
import com.slife.marketplace.util.Constants;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class DealController {

    private final DealService dealService;

    public DealController(DealService dealService) {
        this.dealService = dealService;
    }

    /** v1: Finalize the transaction. */
    @PostMapping("/api/v1/deals/confirm")
    public ResponseEntity<ApiResponse<Deal>> confirmDeal(@Valid @RequestBody ConfirmDealRequest request) {
        Deal deal = dealService.confirm(request);
        return ResponseEntity.ok(ApiResponse.success(Constants.MSG10, deal));
    }

    @PostMapping("/api/deals")
    public ResponseEntity<?> m1(@RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/deals/{id}")
    public ResponseEntity<?> m2(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/deals/{id}/confirm")
    public ResponseEntity<?> m3(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/deals/{id}/cancel")
    public ResponseEntity<?> m4(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/users/{id}/deals")
    public ResponseEntity<?> m5(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }
}