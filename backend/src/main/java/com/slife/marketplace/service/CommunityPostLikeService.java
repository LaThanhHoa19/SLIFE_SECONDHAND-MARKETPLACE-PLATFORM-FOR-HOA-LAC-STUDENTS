package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.ToggleLikeResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostLike;
import com.slife.marketplace.entity.CommunityPostLikeId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostLikeRepository;
import com.slife.marketplace.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityPostLikeService {

    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityPostRepository communityPostRepository;
    private final NotificationService notificationService;
    private final CommunityPostStatsBroadcastService communityPostStatsBroadcastService;
    private final CommunityPostService communityPostService;

    @Transactional
    public ToggleLikeResponse toggle(User user, Long postId) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        if (user.getStatus() != null
                && ("BANNED".equalsIgnoreCase(user.getStatus()) || "RESTRICTED".equalsIgnoreCase(user.getStatus()))) {
            throw new SlifeException(ErrorCode.USER_BANNED_OR_RESTRICTED);
        }
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));
        if (post.getDeletedAt() != null || post.getHiddenAt() != null
                || !CommunityPost.STATUS_ACTIVE.equalsIgnoreCase(String.valueOf(post.getStatus()))) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }

        if (communityPostLikeRepository.existsByUser_IdAndPost_Id(user.getId(), postId)) {
            communityPostLikeRepository.deleteByUser_IdAndPost_Id(user.getId(), postId);
            long count = communityPostLikeRepository.countByPost_Id(postId);
            communityPostStatsBroadcastService.broadcastStats(postId);
            communityPostStatsBroadcastService.broadcastLikedToggled(postId, user.getId(), false);
            return new ToggleLikeResponse(false, count);
        }

        CommunityPostLikeId id = new CommunityPostLikeId();
        id.setUserId(user.getId());
        id.setPostId(postId);

        CommunityPostLike row = new CommunityPostLike();
        row.setId(id);
        row.setUser(user);
        row.setPost(post);
        communityPostLikeRepository.save(row);

        if (post.getAuthor() != null && post.getAuthor().getId() != null
                && !post.getAuthor().getId().equals(user.getId())) {
            notificationService.notifyCommunityPostLiked(post.getAuthor(), user, postId);
        }

        long count = communityPostLikeRepository.countByPost_Id(postId);
        communityPostStatsBroadcastService.broadcastStats(postId);
        communityPostStatsBroadcastService.broadcastLikedToggled(postId, user.getId(), true);
        return new ToggleLikeResponse(true, count);
    }

    @Transactional(readOnly = true)
    public long countByPostId(Long postId) {
        return communityPostLikeRepository.countByPost_Id(postId);
    }

    @Transactional(readOnly = true)
    public boolean isLikedBy(Long userId, Long postId) {
        return communityPostLikeRepository.existsByUser_IdAndPost_Id(userId, postId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostCardResponse> getLikedFeed(User user, int page, int size) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        int pageIdx = Math.max(page, 0);
        int s = size > 0 ? Math.min(size, 50) : 20;
        Pageable pageable = PageRequest.of(pageIdx, s);

        Page<CommunityPost> liked = communityPostLikeRepository.findLikedPostsVisibleByUserId(
                user.getId(), CommunityPost.STATUS_ACTIVE, pageable);

        return communityPostService.toCardPage(liked, user.getId(), false);
    }
}
