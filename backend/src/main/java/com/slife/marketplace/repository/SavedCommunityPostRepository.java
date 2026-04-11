package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPost;
import com.slife.marketplace.entity.SavedCommunityPost;
import com.slife.marketplace.entity.SavedCommunityPostId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedCommunityPostRepository extends JpaRepository<SavedCommunityPost, SavedCommunityPostId> {

    boolean existsByUser_IdAndPost_Id(Long userId, Long postId);

    void deleteByUser_IdAndPost_Id(Long userId, Long postId);

    @EntityGraph(attributePaths = {"post.author", "post.hashtags"})
    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.id IN (
                SELECT s.post.id FROM SavedCommunityPost s
                WHERE s.user.id = :userId
            )
              AND p.status = :activeStatus
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
            ORDER BY p.createdAt DESC
            """)
    Page<CommunityPost> findSavedPostsVisibleByUserId(
            @Param("userId") Long userId,
            @Param("activeStatus") String activeStatus,
            Pageable pageable);

    @Query("""
            SELECT s.post.id FROM SavedCommunityPost s
            WHERE s.user.id = :userId
              AND s.post.id IN :postIds
            """)
    List<Long> findSavedPostIdsByUserAndPostIds(
            @Param("userId") Long userId,
            @Param("postIds") List<Long> postIds);
}
