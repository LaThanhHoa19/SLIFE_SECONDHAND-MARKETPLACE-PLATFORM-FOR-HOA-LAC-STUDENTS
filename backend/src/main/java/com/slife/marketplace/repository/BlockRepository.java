package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Block;
import com.slife.marketplace.entity.BlockId;
import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BlockRepository extends JpaRepository<Block, BlockId> {

    boolean existsByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);

    void deleteByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);

    @Query(
            value = """
                    SELECT new com.slife.marketplace.dto.response.FollowUserSummaryResponse(
                        u.id, u.fullName, u.avatarUrl, u.reputationScore, b.createdAt)
                    FROM Block b JOIN b.blocked u
                    WHERE b.blocker.id = :userId
                      AND (:qBlank = true OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')))
                    """,
            countQuery = """
                    SELECT count(b) FROM Block b JOIN b.blocked u
                    WHERE b.blocker.id = :userId
                      AND (:qBlank = true OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')))
                    """)
    Page<FollowUserSummaryResponse> findBlockedUserSummariesByBlockerId(
            @Param("userId") Long userId,
            @Param("q") String q,
            @Param("qBlank") boolean qBlank,
            Pageable pageable);
}
