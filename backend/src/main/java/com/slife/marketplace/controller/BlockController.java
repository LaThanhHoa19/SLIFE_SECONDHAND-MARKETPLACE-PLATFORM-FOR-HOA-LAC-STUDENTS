package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.BlockService;
import com.slife.marketplace.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class BlockController {

    private final BlockService blockService;
    private final UserService userService;

    public BlockController(BlockService blockService, UserService userService) {
        this.blockService = blockService;
        this.userService = userService;
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(@PathVariable Long id) {
        User me = userService.getCurrentUser();
        blockService.block(me, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @DeleteMapping("/{id}/block")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable Long id) {
        User me = userService.getCurrentUser();
        blockService.unblock(me, id);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @GetMapping("/{id}/block")
    public ResponseEntity<ApiResponse<Boolean>> isBlocked(@PathVariable Long id) {
        User me = userService.getCurrentUser();
        boolean blocked = blockService.isBlockedByCurrentUser(me.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("OK", blocked));
    }

    @GetMapping("/me/blocks")
    public ResponseEntity<ApiResponse<Page<FollowUserSummaryResponse>>> myBlockedUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User me = userService.getCurrentUser();
        Page<FollowUserSummaryResponse> data = blockService.getBlockedUsers(me.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }
}