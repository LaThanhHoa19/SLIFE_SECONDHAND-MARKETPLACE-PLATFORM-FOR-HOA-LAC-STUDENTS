package com.slife.marketplace.repository;

import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.entity.Follow;
import com.slife.marketplace.entity.FollowId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;

@Repository
public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByFollower_IdAndFollowed_Id(Long followerId, Long followedId);

    void deleteByFollower_IdAndFollowed_Id(Long followerId, Long followedId);

    long countByFollowed_Id(Long followedId);

    long countByFollower_Id(Long followerId);

    @Query("SELECT f.followed.id FROM Follow f WHERE f.follower.id = :followerId AND f.followed.id IN :ids")
    Set<Long> findFollowedIdsAmong(@Param("followerId") Long followerId, @Param("ids") Collection<Long> ids);

    @Query(
            value = """
                    SELECT new com.slife.marketplace.dto.response.FollowUserSummaryResponse(
                        u.id, u.fullName, u.avatarUrl, u.reputationScore)
                    FROM Follow f JOIN f.follower u
                    WHERE f.followed.id = :userId
                    ORDER BY f.createdAt DESC
                    """,
            countQuery = "SELECT count(f) FROM Follow f WHERE f.followed.id = :userId")
    Page<FollowUserSummaryResponse> findFollowerSummariesByFollowedId(
            @Param("userId") Long userId, Pageable pageable);

    @Query(
            value = """
                    SELECT new com.slife.marketplace.dto.response.FollowUserSummaryResponse(
                        u.id, u.fullName, u.avatarUrl, u.reputationScore)
                    FROM Follow f JOIN f.followed u
                    WHERE f.follower.id = :userId
                    ORDER BY f.createdAt DESC
                    """,
            countQuery = "SELECT count(f) FROM Follow f WHERE f.follower.id = :userId")
    Page<FollowUserSummaryResponse> findFollowingSummariesByFollowerId(
            @Param("userId") Long userId, Pageable pageable);
}
