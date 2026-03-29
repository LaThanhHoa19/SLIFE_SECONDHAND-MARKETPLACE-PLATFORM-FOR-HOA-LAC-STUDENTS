package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.LandingResponse;
import com.slife.marketplace.service.LandingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hai path cùng payload — tránh lỗi khi client/ghép baseURL (vd. dedupe /api) gọi nhầm {@code /public/landing}.
 */
@RestController
public class PublicLandingController {

    private final LandingService landingService;

    public PublicLandingController(LandingService landingService) {
        this.landingService = landingService;
    }

    @GetMapping({"/api/public/landing", "/public/landing"})
    public ResponseEntity<ApiResponse<LandingResponse>> getLanding() {
        return ResponseEntity.ok(ApiResponse.success("OK", landingService.getLandingPayload()));
    }
}
