package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.CommunityPostLike;
import com.slife.marketplace.entity.CommunityPostLikeId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, CommunityPostLikeId> {

    @EntityGraph(attributePaths = {"post.author", "post.hashtags"})
    @Query("""
            SELECT l.post FROM CommunityPostLike l
            WHERE l.user.id = :userId
              AND l.post.status = :activeStatus
              AND l.post.deletedAt IS NULL
              AND l.post.hiddenAt IS NULL
            ORDER BY l.createdAt DESC
            """)
    Page<CommunityPost> findLikedPostsVisibleByUserId(
            @Param("userId") Long userId,
            @Param("activeStatus") String activeStatus,
            Pageable pageable);


    boolean existsByUser_IdAndPost_Id(Long userId, Long postId);

    void deleteByUser_IdAndPost_Id(Long userId, Long postId);

    long countByPost_Id(Long postId);

    @Query("SELECT l.post.id, COUNT(l) FROM CommunityPostLike l WHERE l.post.id IN :ids GROUP BY l.post.id")
    List<Object[]> countLikesByPostIds(@Param("ids") Collection<Long> ids);

    @Query("SELECT l.post.id FROM CommunityPostLike l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<Long> findPostIdsLikedByUser(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
