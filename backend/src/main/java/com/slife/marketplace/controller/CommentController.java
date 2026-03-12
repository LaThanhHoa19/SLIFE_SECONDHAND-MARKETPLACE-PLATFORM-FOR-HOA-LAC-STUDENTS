package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommentRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * POST /api/v1/comments
     * Create a new top-level comment on a listing.
     */
    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse res = commentService.createComment(request);
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    /**
     * POST /api/v1/comments/{id}/reply
     * Reply to an existing comment (only listing owner allowed).
     */
    @PostMapping("/comments/{id}/reply")
    public ResponseEntity<ApiResponse<CommentResponse>> reply(
            @PathVariable Long id,
            @Valid @RequestBody ReplyCommentRequest request) {
        CommentResponse res = commentService.replyToComment(id, request);
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    /**
     * GET /api/v1/listings/{id}/comments
     * Returns hierarchical comments for a listing (parent with nested replies).
     */
    @GetMapping("/listings/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable Long id) {
        List<CommentResponse> list = commentService.getCommentsForListing(id);
        return ResponseEntity.ok(ApiResponse.success("OK", list));
    }
}

