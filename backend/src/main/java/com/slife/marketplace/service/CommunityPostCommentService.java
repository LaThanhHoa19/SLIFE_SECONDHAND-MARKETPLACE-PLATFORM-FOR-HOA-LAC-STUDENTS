package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommunityPostCommentRequest;
import com.slife.marketplace.dto.request.UpdateCommunityPostCommentRequest;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostComment;
import com.slife.marketplace.entity.CommunityPostCommentImage;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostCommentImageRepository;
import com.slife.marketplace.repository.CommunityPostCommentRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.security.CommentRateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityPostCommentService {

    private static final String HIDDEN_PLACEHOLDER = "[N\u1ed9i dung \u0111\u00e3 b\u1ecb \u1ea9n do vi ph\u1ea1m.]";

    private final CommunityPostCommentRepository communityPostCommentRepository;
    private final CommunityPostCommentImageRepository communityPostCommentImageRepository;
    private final CommunityPostRepository communityPostRepository;
    private final UserService userService;
    private final CommentRateLimitService commentRateLimitService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final CommunityPostStatsBroadcastService communityPostStatsBroadcastService;
    private final ContentModerationService contentModerationService;

    @Transactional
    public CommentResponse createComment(Long postId, CreateCommunityPostCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);
        commentRateLimitService.assertAllowed(currentUser.getId());

        String text = trimOrNull(request.getContent());
        List<String> imageUrls = sanitize(request.getImageUrls());
        validateContentOrImage(text, imageUrls);
        if (text != null) {
            contentModerationService.assertNoBannedKeywords(text);
        }

        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (post.getDeletedAt() != null || post.getHiddenAt() != null
                || !CommunityPost.STATUS_ACTIVE.equalsIgnoreCase(String.valueOf(post.getStatus()))) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }

        CommunityPostComment comment = new CommunityPostComment();
        comment.setContent(text);
        comment.setCreatedAt(Instant.now());
        comment.setUser(currentUser);
        comment.setPost(post);

        CommunityPostComment saved = communityPostCommentRepository.save(comment);
        List<String> savedUrls = saveImages(saved, imageUrls);

        if (post.getAuthor() != null && post.getAuthor().getId() != null
                && !post.getAuthor().getId().equals(currentUser.getId())) {
            notificationService.notifyCommunityPostCommented(post.getAuthor(), currentUser, postId);
        }

        commentRateLimitService.recordSuccess(currentUser.getId());
        communityPostStatsBroadcastService.broadcastStats(postId);
        return toResponse(saved, savedUrls, Collections.emptyList());
    }

    @Transactional
    public CommentResponse replyToComment(Long parentCommentId, ReplyCommunityPostCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);
        commentRateLimitService.assertAllowed(currentUser.getId());

        String text = trimOrNull(request.getContent());
        List<String> imageUrls = sanitize(request.getImageUrls());
        validateContentOrImage(text, imageUrls);
        if (text != null) {
            contentModerationService.assertNoBannedKeywords(text);
        }

        CommunityPostComment parent = communityPostCommentRepository.findById(parentCommentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND));

        CommunityPost post = parent.getPost();
        if (post == null || post.getDeletedAt() != null) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }

        boolean isPostAuthor = post.getAuthor() != null && post.getAuthor().getId().equals(currentUser.getId());
        boolean isParentAuthor = parent.getUser() != null && parent.getUser().getId().equals(currentUser.getId());
        if (!isPostAuthor && !isParentAuthor) {
            throw new SlifeException(ErrorCode.FORBIDDEN,
                    "Chỉ chủ bài viết hoặc tác giả bình luận này mới có thể phản hồi.");
        }

        CommunityPostComment reply = new CommunityPostComment();
        reply.setContent(text);
        reply.setCreatedAt(Instant.now());
        reply.setUser(currentUser);
        reply.setPost(post);
        reply.setParentComment(parent);

        CommunityPostComment saved = communityPostCommentRepository.save(reply);
        List<String> savedUrls = saveImages(saved, imageUrls);

        User parentAuthor = parent.getUser();
        if (parentAuthor != null && parentAuthor.getId() != null
                && !parentAuthor.getId().equals(currentUser.getId())) {
            notificationService.notifyCommunityCommentReply(parentAuthor, currentUser, post.getId());
        }
        User postAuthor = post.getAuthor();
        if (postAuthor != null && postAuthor.getId() != null && !postAuthor.getId().equals(currentUser.getId())) {
            Long parentAuthorId = parentAuthor != null ? parentAuthor.getId() : null;
            if (parentAuthorId == null || !postAuthor.getId().equals(parentAuthorId)) {
                notificationService.notifyCommunityDiscussionJoined(postAuthor, currentUser, post.getId());
            }
        }

        commentRateLimitService.recordSuccess(currentUser.getId());
        communityPostStatsBroadcastService.broadcastStats(post.getId());
        return toResponse(saved, savedUrls, Collections.emptyList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = userService.getCurrentUser();
        CommunityPostComment comment = communityPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND));

        boolean isOwner = comment.getUser() != null && comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        boolean isPostAuthor = comment.getPost() != null && comment.getPost().getAuthor() != null
                && comment.getPost().getAuthor().getId().equals(currentUser.getId());

        if (!isOwner && !isAdmin && !isPostAuthor) {
            throw new SlifeException(ErrorCode.COMMENT_DELETE_FORBIDDEN);
        }

        if (isAdmin) {
            auditLogService.logAdminCommentDelete(currentUser, commentId, comment.getPost() != null ? comment.getPost().getId() : null);
        }

        Long postIdForBroadcast = comment.getPost() != null ? comment.getPost().getId() : null;

        communityPostCommentImageRepository.deleteAllByComment_Id(commentId);
        communityPostCommentRepository.delete(comment);

        if (postIdForBroadcast != null) {
            communityPostStatsBroadcastService.broadcastStats(postIdForBroadcast);
        }
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, UpdateCommunityPostCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        CommunityPostComment comment = communityPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_COMMENT_NOT_FOUND));
        if (comment.getUser() == null || !comment.getUser().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "You can only edit your own comments");
        }

        String text = trimOrNull(request.getContent());
        List<String> imageUrls = sanitize(request.getImageUrls());
        validateContentOrImage(text, imageUrls);
        if (text != null) {
            contentModerationService.assertNoBannedKeywords(text);
        }

        comment.setContent(text);
        if (request.getImageUrls() != null) {
            communityPostCommentImageRepository.deleteAllByComment_Id(commentId);
            saveImages(comment, imageUrls);
        }

        CommunityPostComment saved = communityPostCommentRepository.save(comment);
        List<String> urls = communityPostCommentImageRepository.findByComment_Id(commentId).stream()
                .map(CommunityPostCommentImage::getImageUrl)
                .collect(Collectors.toList());
        return toResponse(saved, urls, List.of());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForPost(Long postId) {
        communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        List<CommunityPostComment> all = communityPostCommentRepository.findByPost_IdOrderByCreatedAtAsc(postId);
        all = all.stream().filter(c -> c.getDeletedAt() == null).collect(Collectors.toList());
        if (all.isEmpty()) {
            return List.of();
        }

        Set<Long> commentIds = all.stream().map(CommunityPostComment::getId).collect(Collectors.toSet());
        Map<Long, List<String>> imagesByCommentId = new HashMap<>();
        for (Long cid : commentIds) {
            List<String> urls = communityPostCommentImageRepository.findByComment_Id(cid).stream()
                    .map(CommunityPostCommentImage::getImageUrl)
                    .collect(Collectors.toList());
            imagesByCommentId.put(cid, urls);
        }

        Map<Long, List<CommunityPostComment>> childrenByParentId = new HashMap<>();
        List<CommunityPostComment> roots = new ArrayList<>();
        for (CommunityPostComment c : all) {
            if (c.getParentComment() == null) {
                roots.add(c);
            } else {
                Long pid = c.getParentComment().getId();
                childrenByParentId.computeIfAbsent(pid, k -> new ArrayList<>()).add(c);
            }
        }

        return roots.stream()
                .map(root -> toResponse(root, imagesByCommentId.getOrDefault(root.getId(), List.of()),
                        buildReplies(root, childrenByParentId, imagesByCommentId)))
                .collect(Collectors.toList());
    }

    private List<CommentResponse> buildReplies(CommunityPostComment parent,
                                               Map<Long, List<CommunityPostComment>> childrenByParentId,
                                               Map<Long, List<String>> imagesByCommentId) {
        List<CommunityPostComment> children = childrenByParentId.getOrDefault(parent.getId(), List.of());
        return children.stream()
                .map(child -> toResponse(child,
                        imagesByCommentId.getOrDefault(child.getId(), List.of()),
                        buildReplies(child, childrenByParentId, imagesByCommentId)))
                .collect(Collectors.toList());
    }

    private List<String> saveImages(CommunityPostComment comment, List<String> imageUrls) {
        List<String> saved = new ArrayList<>();
        for (String url : imageUrls) {
            CommunityPostCommentImage img = new CommunityPostCommentImage();
            img.setComment(comment);
            img.setImageUrl(url);
            img.setCreatedAt(Instant.now());
            communityPostCommentImageRepository.save(img);
            saved.add(url);
        }
        return saved;
    }

    private CommentResponse toResponse(CommunityPostComment c, List<String> imageUrls, List<CommentResponse> replies) {
        CommentResponse res = new CommentResponse();
        res.setId(c.getId());
        boolean hidden = c.getHiddenAt() != null;
        res.setContent(hidden ? HIDDEN_PLACEHOLDER : c.getContent());
        res.setCreatedAt(c.getCreatedAt());
        res.setContentHidden(hidden);

        User u = c.getUser();
        Map<String, Object> author = new HashMap<>();
        if (u != null) {
            author.put("userId", u.getId());
            author.put("fullName", u.getFullName());
            author.put("avatarUrl", u.getAvatarUrl());
        }
        res.setAuthor(author);
        if (!hidden) {
            res.setImages(imageUrls);
        }
        res.setReplies(replies);
        return res;
    }

    private void validateContentOrImage(String text, List<String> imageUrls) {
        boolean hasText = text != null && !text.isBlank();
        boolean hasImage = imageUrls != null && !imageUrls.isEmpty();
        if (!hasText && !hasImage) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Comment must have text or at least one image");
        }
    }

    private void checkNotBannedOrRestricted(User user) {
        if (user.getStatus() != null &&
                ("BANNED".equalsIgnoreCase(user.getStatus()) || "RESTRICTED".equalsIgnoreCase(user.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
    }

    private static String trimOrNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static List<String> sanitize(List<String> urls) {
        if (urls == null) {
            return Collections.emptyList();
        }
        return urls.stream()
                .filter(u -> u != null && !u.isBlank())
                .collect(Collectors.toList());
    }
}
