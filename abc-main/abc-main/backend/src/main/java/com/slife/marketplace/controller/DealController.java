package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.service.DealService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DealController {

    private final DealService dealService;

    public DealController(DealService dealService) {
        this.dealService = dealService;
    }

    @PostMapping("/listings/{listingId}/deals")
    public ResponseEntity<ApiResponse<DealResponse>> createDeal(
            @PathVariable Long listingId,
            @Valid @RequestBody DealRequest request) {
        DealResponse response = dealService.createDeal(listingId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo lượt trả giá thành công", response));
    }

    @PutMapping("/deals/{id}/reject")
    public ResponseEntity<ApiResponse<DealResponse>> rejectDeal(@PathVariable Long id) {
        DealResponse response = dealService.rejectDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối lượt trả giá", response));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelDeal(@PathVariable Long id) {
        dealService.cancelDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lượt trả giá", null));
    }
}