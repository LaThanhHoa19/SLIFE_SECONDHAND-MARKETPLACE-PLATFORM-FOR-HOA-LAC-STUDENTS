package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.entity.Block;
import com.slife.marketplace.entity.BlockId;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.BlockRepository;
import com.slife.marketplace.repository.FollowRepository;
import com.slife.marketplace.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class BlockService {

    private static final int BLOCK_LIST_MAX_PAGE_SIZE = 50;

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    public BlockService(BlockRepository blockRepository,
                        UserRepository userRepository,
                        FollowRepository followRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    @Transactional
    public void block(User blocker, Long blockedUserId) {
        if (blocker == null || blockedUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (blocker.getId().equals(blockedUserId)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "You cannot block yourself");
        }

        User blocked = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new SlifeException(ErrorCode.USER_NOT_FOUND));

        boolean existed = blockRepository.existsByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId());
        if (!existed) {
            BlockId id = new BlockId();
            id.setBlockerId(blocker.getId());
            id.setBlockedId(blocked.getId());

            Block row = new Block();
            row.setId(id);
            row.setBlocker(blocker);
            row.setBlocked(blocked);
            row.setCreatedAt(Instant.now());
            blockRepository.save(row);
        }

        // Best practice: when blocking, sever follow relations in both directions.
        followRepository.deleteByFollower_IdAndFollowed_Id(blocker.getId(), blocked.getId());
        followRepository.deleteByFollower_IdAndFollowed_Id(blocked.getId(), blocker.getId());
    }

    @Transactional
    public void unblock(User blocker, Long blockedUserId) {
        if (blocker == null || blockedUserId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (blocker.getId().equals(blockedUserId)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "You cannot unblock yourself");
        }
        if (!userRepository.existsById(blockedUserId)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }

        blockRepository.deleteByBlocker_IdAndBlocked_Id(blocker.getId(), blockedUserId);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedByCurrentUser(Long blockerId, Long targetUserId) {
        if (blockerId == null || targetUserId == null) {
            return false;
        }
        return blockRepository.existsByBlocker_IdAndBlocked_Id(blockerId, targetUserId);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherDirection(Long userA, Long userB) {
        if (userA == null || userB == null) {
            return false;
        }
        return blockRepository.existsByBlocker_IdAndBlocked_Id(userA, userB)
                || blockRepository.existsByBlocker_IdAndBlocked_Id(userB, userA);
    }

    @Transactional(readOnly = true)
    public Page<FollowUserSummaryResponse> getBlockedUsers(Long blockerId, int page, int size) {
        if (blockerId == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT);
        }
        if (!userRepository.existsById(blockerId)) {
            throw new SlifeException(ErrorCode.USER_NOT_FOUND);
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), clampPageSize(size));
        return blockRepository.findBlockedUserSummariesByBlockerId(blockerId, pageable);
    }

    private static int clampPageSize(int size) {
        return Math.max(1, Math.min(size, BLOCK_LIST_MAX_PAGE_SIZE));
    }
}