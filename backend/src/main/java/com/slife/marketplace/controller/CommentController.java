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
     * Tao comment moi. Phai co it nhat: text hoac anh (hoac ca hai).
     * imageUrls: client upload anh truoc, lay URL, roi gui vao day.
     */
    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse res = commentService.createComment(request);
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    /**
     * POST /api/v1/comments/{id}/reply
     * Chi listing owner duoc reply.
     */
    @PostMapping("/comments/{id}/reply")
    public ResponseEntity<ApiResponse<CommentResponse>> reply(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReplyCommentRequest request) {
        CommentResponse res = commentService.replyToComment(id, request);
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    /**
     * DELETE /api/v1/comments/{id}
     * Cho phep: chu comment | listing owner | admin.
     */
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable("id") Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    /**
     * GET /api/v1/listings/{id}/comments
     * Tra ve danh sach comment (hierarchical: parent + nested replies).
     */
    @GetMapping("/listings/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable("id") Long id) {
        List<CommentResponse> list = commentService.getCommentsForListing(id);
        return ResponseEntity.ok(ApiResponse.success("OK", list));
    }
}