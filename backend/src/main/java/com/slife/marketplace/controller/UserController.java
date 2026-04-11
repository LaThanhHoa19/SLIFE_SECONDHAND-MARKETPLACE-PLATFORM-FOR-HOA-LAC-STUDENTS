package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.UpdateUserRequest;
import com.slife.marketplace.dto.request.FirebasePhoneVerifyRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.UserProfileResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.UserRepository;
import com.slife.marketplace.service.BlockService;
import com.slife.marketplace.service.FirebasePhoneVerificationService;
import com.slife.marketplace.service.FollowService;
import com.slife.marketplace.service.ReviewService;
import com.slife.marketplace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class UserController {

    private final UserRepository userRepository;
    private final FollowService followService;
    private final BlockService blockService;
    private final UserService userService;
    private final ReviewService reviewService;
    private final FirebasePhoneVerificationService firebasePhoneVerificationService;

    public UserController(UserRepository userRepository,
                          FollowService followService,
                          BlockService blockService,
                          UserService userService,
                          ReviewService reviewService,
                          FirebasePhoneVerificationService firebasePhoneVerificationService) {
        this.userRepository = userRepository;
        this.followService = followService;
        this.blockService = blockService;
        this.userService = userService;
        this.reviewService = reviewService;
        this.firebasePhoneVerificationService = firebasePhoneVerificationService;
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
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable("id") String idOrCode) {
        Long id;
        try {
            id = Long.parseLong(idOrCode);
        } catch (NumberFormatException e) {
            id = com.slife.marketplace.util.IdHasher.decode(idOrCode);
        }

        if (id == null) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        Long viewerId = userService.getCurrentUserOptional().map(User::getId).orElse(null);
        if (viewerId != null
                && !viewerId.equals(user.getId())
                && blockService.isBlockedEitherDirection(user.getId(), viewerId)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        UserProfileResponse body = followService.buildProfileForViewer(user, viewerId);
        return ResponseEntity.ok(ApiResponse.success("Success", body));
    }

    @GetMapping("/api/users")
    public ResponseEntity<?> listUsers() {
        return ResponseEntity.ok(ApiResponse.success("Success", userRepository.findAll()));
    }

    @PutMapping("/api/users/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(@RequestBody UpdateUserRequest request) {
        User user = userService.updateCurrentUser(request);
        UserProfileResponse body = followService.buildProfileForViewer(user, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", body));
    }

    @PostMapping(path = "/api/users/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadMyAvatar(@RequestParam("file") MultipartFile file) {
        User user = userService.uploadAvatar(file);
        UserProfileResponse body = followService.buildProfileForViewer(user, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Tải avatar thành công", body));
    }

    @PostMapping(path = "/api/users/me/cover", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadMyCover(@RequestParam("file") MultipartFile file) {
        User user = userService.uploadCover(file);
        UserProfileResponse body = followService.buildProfileForViewer(user, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh bìa thành công", body));
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Object r) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/users/me/phone-verification/firebase")
    public ResponseEntity<ApiResponse<UserProfileResponse>> verifyPhoneWithFirebase(
            @Valid @RequestBody FirebasePhoneVerifyRequest request) {
        User user = firebasePhoneVerificationService.verifyIdTokenAndMarkPhone(request.getIdToken());
        UserProfileResponse body = followService.buildProfileForViewer(user, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Phone number verified", body));
    }

    @GetMapping("/api/users/{id}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable("id") String idOrCode) {
        Long id;
        try {
            id = Long.parseLong(idOrCode);
        } catch (NumberFormatException e) {
            id = com.slife.marketplace.util.IdHasher.decode(idOrCode);
        }

        if (id == null) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        return ResponseEntity.ok(ApiResponse.success("Success", reviewService.getUserReviews(id)));
    }
}
