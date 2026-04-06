package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.TrendingHashtagResponse;
import com.slife.marketplace.service.CommunityHashtagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/community/hashtags")
public class CommunityHashtagController {

    private final CommunityHashtagService communityHashtagService;

    public CommunityHashtagController(CommunityHashtagService communityHashtagService) {
        this.communityHashtagService = communityHashtagService;
    }

    /** Gợi ý hashtag theo tiền tố (đã normalize chữ thường). q rỗng → trả trending gần đây. */
    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<List<String>>> suggest(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", communityHashtagService.suggest(q, limit)));
    }

    /** Hashtag xu hướng theo số bài ACTIVE gắn thẻ trong cửa sổ thời gian. */
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<TrendingHashtagResponse>>> trending(
            @RequestParam(name = "days", defaultValue = "7") int days,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", communityHashtagService.trending(days, limit)));
    }
}
