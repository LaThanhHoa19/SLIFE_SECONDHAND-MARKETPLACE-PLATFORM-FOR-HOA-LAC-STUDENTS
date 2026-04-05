package com.slife.marketplace.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityPostLikeService {

    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityPostRepository communityPostRepository;

    @Transactional
    public ToggleLikeResponse toggle(User user, Long postId) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
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

        long count = communityPostLikeRepository.countByPost_Id(postId);
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
}
