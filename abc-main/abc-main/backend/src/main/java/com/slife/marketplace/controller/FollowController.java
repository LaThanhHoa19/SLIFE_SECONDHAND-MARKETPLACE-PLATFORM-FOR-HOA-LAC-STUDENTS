package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.FollowService;
import com.slife.marketplace.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FollowController {

    private final UserService userService;
    private final FollowService followService;

    public FollowController(UserService userService, FollowService followService) {
        this.userService = userService;
        this.followService = followService;
    }

    @GetMapping("/api/users/{id}/followers")
    public ResponseEntity<ApiResponse<Page<FollowUserSummaryResponse>>> getFollowers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FollowUserSummaryResponse> data = followService.getFollowers(id, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @GetMapping("/api/users/{id}/following")
    public ResponseEntity<ApiResponse<Page<FollowUserSummaryResponse>>> getFollowing(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FollowUserSummaryResponse> data = followService.getFollowing(id, page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    @PostMapping("/api/users/{id}/follow")
    public ResponseEntity<ApiResponse<Void>> follow(@PathVariable Long id) {
        User me = userService.getCurrentUser();
        followService.follow(me, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @DeleteMapping("/api/users/{id}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollow(@PathVariable Long id) {
        User me = userService.getCurrentUser();
        followService.unfollow(me, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
