package com.slife.marketplace.controller;

import com.slife.marketplace.dto.request.CreateCommunityPostRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostRequest;
import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.CommunityPostResponse;
import com.slife.marketplace.dto.response.CursorPageResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.ToggleLikeResponse;
import com.slife.marketplace.dto.response.ToggleSaveResponse;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.service.CommunityPostImageService;
import com.slife.marketplace.service.CommunityPostLikeService;
import com.slife.marketplace.service.CommunityPostService;
import com.slife.marketplace.service.UserService;
import com.slife.marketplace.service.SavedCommunityPostService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community/posts")
public class CommunityPostController {

    private final CommunityPostService communityPostService;
    private final CommunityPostImageService communityPostImageService;
    private final CommunityPostLikeService communityPostLikeService;
    private final SavedCommunityPostService savedCommunityPostService;
    private final UserService userService;

    public CommunityPostController(CommunityPostService communityPostService,
                                   CommunityPostImageService communityPostImageService,
                                   CommunityPostLikeService communityPostLikeService,
                                   SavedCommunityPostService savedCommunityPostService,
                                   UserService userService) {
        this.communityPostService = communityPostService;
        this.communityPostImageService = communityPostImageService;
        this.communityPostLikeService = communityPostLikeService;
        this.savedCommunityPostService = savedCommunityPostService;
        this.userService = userService;
    }

    @GetMapping("/form-config")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> formConfig() {
        int max = communityPostService.getMaxImagesPerPost();
        return ResponseEntity.ok(ApiResponse.success("OK", Map.of(
                "maxImagesPerPost", max,
                "maxImageSizeMB", CommunityPostImageService.MAX_IMAGE_MB,
                "maxDescriptionLength", CommunityPostService.MAX_DESCRIPTION_LENGTH)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "limit", required = false) Integer limit,
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "hashtag", required = false) String hashtag,
            @RequestParam(name = "sort", defaultValue = "latest") String sort) {
        User viewer = userService.getCurrentUserOptional().orElse(null);
        // Backward compatible: use cursor mode when cursor/limit is provided; otherwise keep page/size.
        if ((cursor != null && !cursor.isBlank()) || limit != null) {
            int lim = limit != null ? limit : 15;
            CursorPageResponse<CommunityPostCardResponse> out = communityPostService.getFeedCursor(lim, cursor, hashtag, sort, viewer);
            return ResponseEntity.ok(ApiResponse.success("OK", out));
        }
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostService.getFeed(page, size, hashtag, sort, viewer)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> get(@PathVariable("id") Long id) {
        User viewer = userService.getCurrentUserOptional().orElse(null);
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostService.getById(id, viewer)));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<CommunityPostResponse>> createJson(
            @Valid @RequestBody CreateCommunityPostRequest request) {
        User author = userService.getCurrentUser();
        CommunityPostResponse res = communityPostService.createPostWithImages(author, request, List.of());
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CommunityPostResponse>> createMultipart(
            @RequestPart("payload") @Valid CreateCommunityPostRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        User author = userService.getCurrentUser();
        CommunityPostResponse res = communityPostService.createPostWithImages(author, request, images);
        return ResponseEntity.ok(ApiResponse.success("OK", res));
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<CommunityPostResponse>> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCommunityPostRequest request) {
        User author = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostService.updatePost(id, author, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        User author = userService.getCurrentUser();
        communityPostService.softDeletePost(id, author);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> uploadImages(
            @PathVariable("id") Long id,
            @RequestPart("images") List<MultipartFile> images) {
        User currentUser = userService.getCurrentUser();
        communityPostImageService.uploadPostImages(id, images, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable("id") Long id,
            @PathVariable("imageId") Long imageId) {
        User currentUser = userService.getCurrentUser();
        communityPostImageService.deletePostImage(id, imageId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<ToggleLikeResponse>> toggleLike(@PathVariable("id") Long id) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostLikeService.toggle(user, id)));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<ApiResponse<ToggleSaveResponse>> toggleSave(@PathVariable("id") Long id) {
        User user = userService.getCurrentUser();
        boolean saved = savedCommunityPostService.toggle(user, id);
        return ResponseEntity.ok(ApiResponse.success("OK", new ToggleSaveResponse(saved)));
    }

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityPostCardResponse>>> listSaved(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", savedCommunityPostService.getSavedFeed(user, page, size)));
    }

    @GetMapping("/liked")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityPostCardResponse>>> listLiked(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostLikeService.getLikedFeed(user, page, size)));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityPostCardResponse>>> listMine(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostService.getMine(user, page, size)));
    }

    @GetMapping("/by-author/{authorId}")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityPostCardResponse>>> listByAuthor(
            @PathVariable("authorId") Long authorId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User viewer = userService.getCurrentUserOptional().orElse(null);
        return ResponseEntity.ok(ApiResponse.success("OK", communityPostService.getByAuthor(authorId, page, size, viewer)));
    }
}
