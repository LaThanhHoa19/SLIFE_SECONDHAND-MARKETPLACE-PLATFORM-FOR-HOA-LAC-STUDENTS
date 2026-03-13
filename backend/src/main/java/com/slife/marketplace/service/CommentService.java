package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommentRequest;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.entity.Comment;
import com.slife.marketplace.entity.CommentImage;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommentImageRepository;
import com.slife.marketplace.repository.CommentRepository;
import com.slife.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentImageRepository commentImageRepository;
    private final ListingRepository listingRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);

        String text = trimOrNull(request.getContent());
        List<String> imageUrls = sanitize(request.getImageUrls());
        validateContentOrImage(text, imageUrls);

        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        Comment comment = new Comment();
        comment.setContent(text);
        comment.setCreatedAt(Instant.now());
        comment.setUser(currentUser);
        comment.setListing(listing);

        Comment saved = commentRepository.save(comment);
        List<String> savedUrls = saveImages(saved, imageUrls);

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            notificationService.notifyListingCommented(
                    listing.getSeller(), currentUser,
                    listing.getId(), listing.getTitle());
        }

        return toResponse(saved, savedUrls, Collections.emptyList());
    }

    @Transactional
    public CommentResponse replyToComment(Long parentCommentId, ReplyCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);

        String text = trimOrNull(request.getContent());
        List<String> imageUrls = sanitize(request.getImageUrls());
        validateContentOrImage(text, imageUrls);

        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMENT_NOT_FOUND));

        Listing listing = parent.getListing();
        if (listing == null) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Only listing owner can reply to comments");
        }

        Comment reply = new Comment();
        reply.setContent(text);
        reply.setCreatedAt(Instant.now());
        reply.setUser(currentUser);
        reply.setListing(listing);
        reply.setParentComment(parent);

        Comment saved = commentRepository.save(reply);
        List<String> savedUrls = saveImages(saved, imageUrls);

        return toResponse(saved, savedUrls, Collections.emptyList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = userService.getCurrentUser();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMENT_NOT_FOUND));

        boolean isOwner        = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin        = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        boolean isListingOwner = comment.getListing() != null
                && comment.getListing().getSeller().getId().equals(currentUser.getId());

        if (!isOwner && !isAdmin && !isListingOwner) {
            throw new SlifeException(ErrorCode.COMMENT_DELETE_FORBIDDEN);
        }

        // Xoa anh truoc de tranh FK constraint violation tren comment_images
        commentImageRepository.deleteAll(commentImageRepository.findByComment_Id(commentId));
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForListing(Long listingId) {
        List<Comment> all = commentRepository.findByListing_IdOrderByCreatedAtAsc(listingId);
        if (all.isEmpty()) return List.of();

        // Load tat ca images 1 lan cho toan bo comments -> tranh N+1
        Set<Long> commentIds = all.stream().map(Comment::getId).collect(Collectors.toSet());
        Map<Long, List<String>> imagesByCommentId = new HashMap<>();
        for (Long cid : commentIds) {
            List<String> urls = commentImageRepository.findByComment_Id(cid).stream()
                    .map(CommentImage::getImageUrl).collect(Collectors.toList());
            imagesByCommentId.put(cid, urls);
        }

        Map<Long, List<Comment>> childrenByParentId = new HashMap<>();
        List<Comment> roots = new ArrayList<>();
        for (Comment c : all) {
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

    // ─── Private helpers ────────────────────────────────────────────────────

    /** Luu anh va tra ve danh sach URL da luu */
    private List<String> saveImages(Comment comment, List<String> imageUrls) {
        List<String> saved = new ArrayList<>();
        for (String url : imageUrls) {
            CommentImage img = new CommentImage();
            img.setComment(comment);
            img.setImageUrl(url);
            commentImageRepository.save(img);
            saved.add(url);
        }
        return saved;
    }

    private List<CommentResponse> buildReplies(Comment parent,
                                               Map<Long, List<Comment>> childrenByParentId,
                                               Map<Long, List<String>> imagesByCommentId) {
        List<Comment> children = childrenByParentId.getOrDefault(parent.getId(), List.of());
        return children.stream()
                .map(child -> toResponse(child,
                        imagesByCommentId.getOrDefault(child.getId(), List.of()),
                        buildReplies(child, childrenByParentId, imagesByCommentId)))
                .collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment c, List<String> imageUrls, List<CommentResponse> replies) {
        CommentResponse res = new CommentResponse();
        res.setId(c.getId());
        res.setContent(c.getContent());
        res.setCreatedAt(c.getCreatedAt());

        User u = c.getUser();
        Map<String, Object> author = new HashMap<>();
        if (u != null) {
            author.put("userId",    u.getId());
            author.put("fullName",  u.getFullName());
            author.put("avatarUrl", u.getAvatarUrl());
        }
        res.setAuthor(author);
        res.setImages(imageUrls);
        res.setReplies(replies);
        return res;
    }

    private void validateContentOrImage(String text, List<String> imageUrls) {
        boolean hasText  = text != null && !text.isBlank();
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
        if (urls == null) return Collections.emptyList();
        return urls.stream()
                .filter(u -> u != null && !u.isBlank())
                .collect(Collectors.toList());
    }
}