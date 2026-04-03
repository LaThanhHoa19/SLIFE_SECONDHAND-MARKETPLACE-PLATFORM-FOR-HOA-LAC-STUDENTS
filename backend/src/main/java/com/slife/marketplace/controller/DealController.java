package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.DealRequest;
import com.slife.marketplace.dto.request.SealDealRequest;
import com.slife.marketplace.dto.request.UpdatePickupTimeRequest;
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

    /** Người bán chốt đơn trong chat → deal PENDING trong DB. */
    @PostMapping("/listings/{listingId}/deals/seal")
    public ResponseEntity<ApiResponse<DealResponse>> sealDeal(
            @PathVariable Long listingId,
            @Valid @RequestBody SealDealRequest request) {
        DealResponse response = dealService.sealDealBySeller(listingId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã chốt đơn (chờ người mua xác nhận)", response));
    }

    /** Người mua chấp nhận sau khi người bán chốt đơn → COMPLETED. */
    @PutMapping("/listings/{listingId}/deals/pending/accept")
    public ResponseEntity<ApiResponse<DealResponse>> buyerAcceptPending(@PathVariable Long listingId) {
        DealResponse response = dealService.buyerAcceptPendingDeal(listingId);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận giao dịch", response));
    }

    /** Người mua từ chối sau khi người bán chốt đơn → REJECTED. */
    @PutMapping("/listings/{listingId}/deals/pending/reject")
    public ResponseEntity<ApiResponse<DealResponse>> buyerRejectPending(@PathVariable Long listingId) {
        DealResponse response = dealService.buyerRejectPendingDeal(listingId);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối giao dịch", response));
    }

    @PutMapping("/deals/{id}/reject")
    public ResponseEntity<ApiResponse<DealResponse>> rejectDeal(@PathVariable Long id) {
        DealResponse response = dealService.rejectDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối lượt trả giá", response));
    }

    @PutMapping("/deals/{id}/confirm")
    public ResponseEntity<ApiResponse<DealResponse>> confirmDeal(@PathVariable Long id) {
        DealResponse response = dealService.confirmDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận giao dịch", response));
    }

    @PutMapping("/deals/{id}/pickup-time")
    public ResponseEntity<ApiResponse<DealResponse>> updatePickupTime(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePickupTimeRequest request) {
        DealResponse response = dealService.updatePickupTime(id, request.getPickupTime());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thời gian nhận hàng", response));
    }

    @PostMapping("/deals/{id}/reminder")
    public ResponseEntity<ApiResponse<Void>> sendReminder(@PathVariable Long id) {
        dealService.sendReminder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi nhắc nhở", null));
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
