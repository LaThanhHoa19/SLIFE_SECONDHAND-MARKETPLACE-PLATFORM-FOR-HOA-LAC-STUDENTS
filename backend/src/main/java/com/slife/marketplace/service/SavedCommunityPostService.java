package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.CommunityPostCardResponse;
import com.slife.marketplace.dto.response.PagedResponse;
import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.SavedCommunityPost;
import com.slife.marketplace.entity.SavedCommunityPostId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CommunityPostRepository;
import com.slife.marketplace.repository.SavedCommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SavedCommunityPostService {

    private final SavedCommunityPostRepository savedCommunityPostRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityPostService communityPostService;
    private final CommunityPostStatsBroadcastService communityPostStatsBroadcastService;

    @Transactional
    public boolean toggle(User user, Long postId) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND));

        if (post.getDeletedAt() != null || post.getHiddenAt() != null
                || !CommunityPost.STATUS_ACTIVE.equalsIgnoreCase(String.valueOf(post.getStatus()))) {
            throw new SlifeException(ErrorCode.COMMUNITY_POST_NOT_FOUND);
        }

        if (savedCommunityPostRepository.existsByUser_IdAndPost_Id(user.getId(), postId)) {
            savedCommunityPostRepository.deleteByUser_IdAndPost_Id(user.getId(), postId);
            communityPostStatsBroadcastService.broadcastSavedToggled(postId, user.getId(), false);
            return false;
        }

        SavedCommunityPostId id = new SavedCommunityPostId();
        id.setUserId(user.getId());
        id.setPostId(postId);

        SavedCommunityPost row = new SavedCommunityPost();
        row.setId(id);
        row.setUser(user);
        row.setPost(post);
        savedCommunityPostRepository.save(row);
        communityPostStatsBroadcastService.broadcastSavedToggled(postId, user.getId(), true);
        return true;
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostCardResponse> getSavedFeed(User user, int page, int size) {
        if (user == null) {
            throw new SlifeException(ErrorCode.UNAUTHORIZED);
        }

        int pageIdx = Math.max(page, 0);
        int s = size > 0 ? Math.min(size, 50) : 20;
        Pageable pageable = PageRequest.of(pageIdx, s);

        Page<CommunityPost> saved = savedCommunityPostRepository.findSavedPostsVisibleByUserId(
                user.getId(), CommunityPost.STATUS_ACTIVE, pageable);

        return communityPostService.toCardPage(saved, user.getId(), true);
    }
}
