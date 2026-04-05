package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostCommentRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.service.CommunityPostCommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Bình luận bài cộng đồng — pattern tương tự {@link com.slife.marketplace.controller.CommentController} (listing).
 */
@RestController
@RequestMapping("/api/v1")
public class CommunityPostCommentController {

    private final CommunityPostCommentService communityPostCommentService;

    public CommunityPostCommentController(CommunityPostCommentService communityPostCommentService) {
        this.communityPostCommentService = communityPostCommentService;
    }

    @GetMapping("/community-posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable("postId") Long postId) {
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostCommentService.getCommentsForPost(postId)));
    }

    @PostMapping("/community-posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CreateCommunityPostCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostCommentService.createComment(postId, request)));
    }

    @PostMapping("/community-post-comments/{id}/reply")
    public ResponseEntity<ApiResponse<CommentResponse>> reply(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReplyCommunityPostCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostCommentService.replyToComment(id, request)));
    }

    @DeleteMapping("/community-post-comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable("id") Long id) {
        communityPostCommentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    @PutMapping("/community-post-comments/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCommunityPostCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Comment updated", communityPostCommentService.updateComment(id, request)));
    }
}
