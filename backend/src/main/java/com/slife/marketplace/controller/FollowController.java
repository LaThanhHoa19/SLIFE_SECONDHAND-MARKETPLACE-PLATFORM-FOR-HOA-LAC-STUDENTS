package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.FollowService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FollowController {

    private final UserService userService;
    private final FollowService followService;

    public FollowController(UserService userService, FollowService followService) {
        this.userService = userService;
        this.followService = followService;
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
