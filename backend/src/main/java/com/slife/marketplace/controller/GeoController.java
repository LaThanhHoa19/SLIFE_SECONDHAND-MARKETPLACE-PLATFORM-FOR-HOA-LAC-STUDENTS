package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.service.VietmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final VietmapService vietmapService;

    public GeoController(VietmapService vietmapService) {
        this.vietmapService = vietmapService;
    }

    /**
     * GET /api/geo/search?q=...&lat=...&lng=...
     * Trả về danh sách gợi ý địa điểm từ Vietmap (BE proxy).
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> search(
            @RequestParam("q") String query,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng) {

        List<Map<String, Object>> results = vietmapService.search(query, lat, lng);
        return ResponseEntity.ok(ApiResponse.success("OK", results));
    }

    /**
     * GET /api/geo/reverse?lat=...&lng=...
     * Dùng khi user gim thẳng lên bản đồ: trả về locationName + addressText.
     */
    @GetMapping("/reverse")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reverse(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng) {

        Map<String, Object> result = vietmapService.reverse(lat, lng);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }
}

