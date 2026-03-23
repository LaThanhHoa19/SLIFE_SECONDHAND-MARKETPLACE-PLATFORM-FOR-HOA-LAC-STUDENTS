package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.UserProfileResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.service.FollowService;
import com.slife.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {

    private final UserRepository userRepository;
    private final FollowService followService;
    private final UserService userService;

    public UserController(UserRepository userRepository, FollowService followService, UserService userService) {
        this.userRepository = userRepository;
        this.followService = followService;
        this.userService = userService;
    }

    @GetMapping("/api/users/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        UserProfileResponse body = followService.buildProfileForViewer(user, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Success", body));
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        Long viewerId = userService.getCurrentUserOptional().map(User::getId).orElse(null);
        UserProfileResponse body = followService.buildProfileForViewer(user, viewerId);
        return ResponseEntity.ok(ApiResponse.success("Success", body));
    }

    @GetMapping("/api/users")
    public ResponseEntity<?> listUsers() {
        return ResponseEntity.ok(ApiResponse.success("Success", userRepository.findAll()));
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id, @RequestParam boolean blocked) {
        return ResponseEntity.ok().build();
    }
}
