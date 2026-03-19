package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.service.VietmapService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final VietmapService vietmapService;
    private final String vietmapTileKey;

    public GeoController(
            VietmapService vietmapService,
            @Value("${vietmap.tileKey:}") String vietmapTileKey) {
        this.vietmapService = vietmapService;
        this.vietmapTileKey = vietmapTileKey;
    }

    /**
     * GET /api/geo/client-config
     * Trả tile key cho bản đồ khi dev chạy FE không có VITE_VIETMAP_TILE_KEY (ví dụ npm run dev + Spring local).
     */
    @GetMapping("/client-config")
    public ResponseEntity<ApiResponse<Map<String, String>>> clientConfig() {
        Map<String, String> payload = new HashMap<>();
        if (StringUtils.hasText(vietmapTileKey)) {
            payload.put("tileKey", vietmapTileKey.trim());
        }
        return ResponseEntity.ok(ApiResponse.success("OK", payload));
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
     * GET /api/geo/place?refid=...
     * Lấy lat/lng + display từ ref_id (bắt buộc sau khi chọn gợi ý search v3).
     */
    @GetMapping("/place")
    public ResponseEntity<ApiResponse<Map<String, Object>>> place(@RequestParam("refid") String refid) {
        Map<String, Object> result = vietmapService.placeByRefId(refid);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
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

