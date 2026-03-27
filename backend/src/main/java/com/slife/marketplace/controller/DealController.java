package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.DealResponse;
import com.slife.marketplace.service.DealService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/deals/{id}")
    public ResponseEntity<ApiResponse<DealResponse>> getDeal(@PathVariable Long id) {
        DealResponse response = dealService.getDealById(id);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * List deals related to current user.
     * type=proposed: deals do current user đề xuất (proposed_by)
     * type=received: deals thuộc listing của current user (listing.seller)
     * type omitted: trả về tất cả deals liên quan tới current user
     */
    @GetMapping("/deals")
    public ResponseEntity<ApiResponse<List<DealResponse>>> listMyDeals(
            @RequestParam(name = "type", required = false) String type) {
        List<DealResponse> data = dealService.listMyDeals(type);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelDeal(@PathVariable Long id) {
        dealService.cancelDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lượt trả giá", null));
    }
}
