package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.dto.response.UserProfileResponse;
import com.slife.marketplace.entity.Follow;
import com.slife.marketplace.entity.FollowId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.BlockRepository;
import com.slife.marketplace.repository.FollowRepository;
import com.slife.marketplace.repository.ListingRepository;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final BlockService blockService;
    private final NotificationService notificationService;
    private final ListingRepository listingRepository;

    public FollowService(FollowRepository followRepository,
                         UserRepository userRepository,
                         BlockRepository blockRepository,
                         BlockService blockService,
                         NotificationService notificationService,
                         ListingRepository listingRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.blockService = blockService;
        this.notificationService = notificationService;
        this.listingRepository = listingRepository;
    }


    private static final int FOLLOW_LIST_MAX_PAGE_SIZE = 50;

    @Transactional(readOnly = true)
    public Page<FollowUserSummaryResponse> getFollowers(Long profileUserId, int page, int size) {
        if (profileUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (!userRepository.existsById(profileUserId)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), clampPageSize(size));
        return followRepository.findFollowerSummariesByFollowedId(profileUserId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<FollowUserSummaryResponse> getFollowing(Long profileUserId, int page, int size) {
        if (profileUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (!userRepository.existsById(profileUserId)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), clampPageSize(size));
        return followRepository.findFollowingSummariesByFollowerId(profileUserId, pageable);
    }

    private static int clampPageSize(int size) {
        return Math.max(1, Math.min(size, FOLLOW_LIST_MAX_PAGE_SIZE));
    }


    @Transactional(readOnly = true)
    public long countFollowers(Long userId) {
        return followRepository.countByFollowed_Id(userId);
    }

    @Transactional(readOnly = true)
    public long countFollowing(Long userId) {
        return followRepository.countByFollower_Id(userId);
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followedId) {
        if (followerId == null || followedId == null) {
            return false;
        }
        return followRepository.existsByFollower_IdAndFollowed_Id(followerId, followedId);
    }

    /**
     * Subset of {@code candidateFollowedIds} that {@code followerId} follows.
     */
    @Transactional(readOnly = true)
    public Set<Long> findFollowedIdsAmong(Long followerId, Collection<Long> candidateFollowedIds) {
        if (followerId == null || candidateFollowedIds == null || candidateFollowedIds.isEmpty()) {
            return Collections.emptySet();
        }
        return followRepository.findFollowedIdsAmong(followerId, candidateFollowedIds);
    }

    @Transactional(readOnly = true)
    public Set<Long> findAllFollowedIds(Long followerId) {
        if (followerId == null) {
            return Collections.emptySet();
        }
        List<Long> ids = followRepository.findFollowedIdsByFollowerId(followerId);
        if (ids == null || ids.isEmpty()) {
            return Collections.emptySet();
        }
        return new HashSet<>(ids);
    }

    @Transactional(readOnly = true)
    public Set<Long> findFollowerIdsOfUser(Long followedId) {
        if (followedId == null) {
            return Collections.emptySet();
        }
        List<Long> ids = followRepository.findFollowerIdsByFollowedId(followedId);
        if (ids == null || ids.isEmpty()) {
            return Collections.emptySet();
        }
        return new HashSet<>(ids);
    }

    private void assertNotBlocked(Long followerId, Long followedId) {
        if (blockRepository.existsByBlocker_IdAndBlocked_Id(followerId, followedId)
                || blockRepository.existsByBlocker_IdAndBlocked_Id(followedId, followerId)) {
            throw new SlifeException(ErrorCode.FOLLOW_BLOCKED);
        }
    }

    @Transactional
    public void follow(User follower, Long followedUserId) {
        Objects.requireNonNull(follower, "follower");
        if (followedUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (follower.getId().equals(followedUserId)) {
            throw new SlifeException(ErrorCode.FOLLOW_SELF);
        }
        assertNotBlocked(follower.getId(), followedUserId);
        User followed = userRepository.findById(followedUserId)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));
        if (followRepository.existsByFollower_IdAndFollowed_Id(follower.getId(), followed.getId())) {
            throw new SlifeException(ErrorCode.FOLLOW_ALREADY);
        }
        FollowId id = new FollowId();
        id.setFollowerId(follower.getId());
        id.setFollowedId(followed.getId());
        Follow row = new Follow();
        row.setId(id);
        row.setFollower(follower);
        row.setFollowed(followed);
        row.setCreatedAt(Instant.now());
        followRepository.save(row);
        notificationService.notifyNewFollower(followed, follower);
    }

    @Transactional
    public void unfollow(User follower, Long followedUserId) {
        Objects.requireNonNull(follower, "follower");
        if (followedUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (!followRepository.existsByFollower_IdAndFollowed_Id(follower.getId(), followedUserId)) {
            throw new SlifeException(ErrorCode.FOLLOW_NOT_FOLLOWING);
        }
        followRepository.deleteByFollower_IdAndFollowed_Id(follower.getId(), followedUserId);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse buildProfileForViewer(User profileUser, Long viewerUserId) {
        UserProfileResponse dto = UserProfileResponse.fromUser(profileUser);
        dto.setFollowerCount(countFollowers(profileUser.getId()));
        dto.setFollowingCount(countFollowing(profileUser.getId()));
        dto.setListingCount(listingRepository.countBySeller_IdAndStatus(profileUser.getId(), "ACTIVE"));
        if (viewerUserId != null && !viewerUserId.equals(profileUser.getId())) {
            dto.setIsFollowedByViewer(isFollowing(viewerUserId, profileUser.getId()));
            dto.setIsBlockedByViewer(blockService.isBlockedByCurrentUser(viewerUserId, profileUser.getId()));
            dto.setHasBlockedViewer(blockService.isBlockedByCurrentUser(profileUser.getId(), viewerUserId));
        } else {
            dto.setIsFollowedByViewer(null);
            dto.setIsBlockedByViewer(null);
            dto.setHasBlockedViewer(null);
        }
        return dto;
    }
}
