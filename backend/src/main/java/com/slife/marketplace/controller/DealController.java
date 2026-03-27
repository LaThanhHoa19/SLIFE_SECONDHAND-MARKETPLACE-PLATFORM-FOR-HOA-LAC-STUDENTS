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
     * List deals of current user by role.
     * role=buyer (default): deals proposed by current user
     * role=seller: deals on listings owned by current user
     */
    @GetMapping("/deals")
    public ResponseEntity<ApiResponse<List<DealResponse>>> listMyDeals(
            @RequestParam(name = "role", defaultValue = "buyer") String role) {
        List<DealResponse> data = dealService.listMyDeals(role);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelDeal(@PathVariable Long id) {
        dealService.cancelDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lượt trả giá", null));
    }
}
