package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    /** author + hashtags để tránh N+1 khi build card feed */
    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            """)
    Page<CommunityPost> findVisibleForViewer(
            @Param("status") String status,
            @Param("viewerId") Long viewerId,
            Pageable pageable);

    @Query("""
            SELECT p FROM CommunityPost p
            LEFT JOIN FETCH p.author
            WHERE p.id = :id AND p.deletedAt IS NULL
            """)
    Optional<CommunityPost> findByIdWithAuthor(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE CommunityPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);
}
