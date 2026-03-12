package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCommentRequest;
import com.slife.marketplace.dto.request.ReplyCommentRequest;
import com.slife.marketplace.dto.response.CommentResponse;
import com.slife.marketplace.entity.Comment;
import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
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
    private final ListingRepository listingRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);

        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new SlifeException(ErrorCode.LISTING_NOT_FOUND));

        Comment comment = new Comment();
        comment.setContent(request.getContent().trim());
        comment.setCreatedAt(Instant.now());
        comment.setUser(currentUser);
        comment.setListing(listing);

        Comment saved = commentRepository.save(comment);

        // Notify listing owner (avoid self-notify)
        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            notificationService.notifyListingCommented(
                    listing.getSeller(),
                    currentUser,
                    listing.getId(),
                    listing.getTitle()
            );
        }

        return toResponse(saved, Collections.emptyList());
    }

    @Transactional
    public CommentResponse replyToComment(Long parentCommentId, ReplyCommentRequest request) {
        User currentUser = userService.getCurrentUser();
        checkNotBannedOrRestricted(currentUser);

        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Parent comment not found"));

        Listing listing = parent.getListing();
        if (listing == null) {
            throw new SlifeException(ErrorCode.LISTING_NOT_FOUND);
        }

        // BR-09: only listing owner can reply
        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new SlifeException(ErrorCode.FORBIDDEN, "Only listing owner can reply to comments");
        }

        Comment reply = new Comment();
        reply.setContent(request.getContent().trim());
        reply.setCreatedAt(Instant.now());
        reply.setUser(currentUser);
        reply.setListing(listing);
        reply.setParentComment(parent);

        Comment saved = commentRepository.save(reply);
        return toResponse(saved, Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForListing(Long listingId) {
        List<Comment> all = commentRepository.findByListing_IdOrderByCreatedAtAsc(listingId);
        if (all.isEmpty()) {
            return List.of();
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
                .map(root -> toResponse(root, buildReplies(root, childrenByParentId)))
                .collect(Collectors.toList());
    }

    private List<CommentResponse> buildReplies(Comment parent, Map<Long, List<Comment>> childrenByParentId) {
        List<Comment> children = childrenByParentId.getOrDefault(parent.getId(), List.of());
        return children.stream()
                .map(child -> toResponse(child, buildReplies(child, childrenByParentId)))
                .collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment c, List<CommentResponse> replies) {
        CommentResponse res = new CommentResponse();
        res.setId(c.getId());
        res.setContent(c.getContent());
        res.setCreatedAt(c.getCreatedAt());

        User u = c.getUser();
        Map<String, Object> author = new HashMap<>();
        if (u != null) {
            author.put("userId", u.getId());
            author.put("fullName", u.getFullName());
            author.put("avatarUrl", u.getAvatarUrl());
        }
        res.setAuthor(author);
        res.setReplies(replies);
        return res;
    }

    private void checkNotBannedOrRestricted(User user) {
        if (user.getStatus() != null &&
                ("BANNED".equalsIgnoreCase(user.getStatus()) || "RESTRICTED".equalsIgnoreCase(user.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
    }
}

