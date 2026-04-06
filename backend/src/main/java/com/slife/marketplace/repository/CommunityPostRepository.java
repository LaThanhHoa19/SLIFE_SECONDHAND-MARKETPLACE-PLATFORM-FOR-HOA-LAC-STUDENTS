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

import java.time.Instant;
import java.util.List;
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

    // Cursor-based pagination (latest)
    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND (
                   :cursorCreatedAt IS NULL
                   OR p.createdAt < :cursorCreatedAt
                   OR (p.createdAt = :cursorCreatedAt AND p.id < :cursorId)
              )
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY p.createdAt DESC, p.id DESC
            """)
    List<CommunityPost> findVisibleForViewerCursorLatest(
            @Param("status") String status,
            @Param("viewerId") Long viewerId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT DISTINCT p FROM CommunityPost p
            JOIN p.hashtags h
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND h.tag = :tag
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY p.createdAt DESC
            """)
    Page<CommunityPost> findVisibleForViewerByHashtagLatest(
            @Param("status") String status,
            @Param("tag") String tag,
            @Param("viewerId") Long viewerId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT DISTINCT p FROM CommunityPost p
            JOIN p.hashtags h
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND h.tag = :tag
              AND (
                   :cursorCreatedAt IS NULL
                   OR p.createdAt < :cursorCreatedAt
                   OR (p.createdAt = :cursorCreatedAt AND p.id < :cursorId)
              )
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY p.createdAt DESC, p.id DESC
            """)
    List<CommunityPost> findVisibleForViewerByHashtagCursorLatest(
            @Param("status") String status,
            @Param("tag") String tag,
            @Param("viewerId") Long viewerId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT DISTINCT p FROM CommunityPost p
            JOIN p.hashtags h
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND h.tag = :tag
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY (
                (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
            ) DESC, p.createdAt DESC
            """)
    Page<CommunityPost> findVisibleForViewerByHashtagTop(
            @Param("status") String status,
            @Param("tag") String tag,
            @Param("viewerId") Long viewerId,
            Pageable pageable);

    // Cursor-based pagination (top). Note: score may change over time; cursor still prevents duplicates.
    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT DISTINCT p FROM CommunityPost p
            JOIN p.hashtags h
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND h.tag = :tag
              AND (
                   :cursorScore IS NULL
                   OR (
                       (
                           (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                           + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
                       ) < :cursorScore
                       OR (
                           (
                               (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                               + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
                           ) = :cursorScore
                           AND (
                               p.createdAt < :cursorCreatedAt
                               OR (p.createdAt = :cursorCreatedAt AND p.id < :cursorId)
                           )
                       )
                   )
              )
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY (
                (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
            ) DESC, p.createdAt DESC, p.id DESC
            """)
    List<CommunityPost> findVisibleForViewerByHashtagCursorTop(
            @Param("status") String status,
            @Param("tag") String tag,
            @Param("viewerId") Long viewerId,
            @Param("cursorScore") Long cursorScore,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

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
            ORDER BY (
                (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
            ) DESC, p.createdAt DESC
            """)
    Page<CommunityPost> findVisibleForViewerTop(
            @Param("status") String status,
            @Param("viewerId") Long viewerId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"author", "hashtags"})
    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.status = :status
              AND p.deletedAt IS NULL
              AND p.hiddenAt IS NULL
              AND (
                   :cursorScore IS NULL
                   OR (
                       (
                           (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                           + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
                       ) < :cursorScore
                       OR (
                           (
                               (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                               + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
                           ) = :cursorScore
                           AND (
                               p.createdAt < :cursorCreatedAt
                               OR (p.createdAt = :cursorCreatedAt AND p.id < :cursorId)
                           )
                       )
                   )
              )
              AND (:viewerId IS NULL OR NOT EXISTS (
                  SELECT 1 FROM Block blk
                  WHERE blk.blocker.id = :viewerId AND blk.blocked.id = p.author.id
              ))
            ORDER BY (
                (SELECT COUNT(l) FROM CommunityPostLike l WHERE l.post.id = p.id)
                + (SELECT COUNT(c) FROM CommunityPostComment c WHERE c.post.id = p.id AND c.deletedAt IS NULL)
            ) DESC, p.createdAt DESC, p.id DESC
            """)
    List<CommunityPost> findVisibleForViewerCursorTop(
            @Param("status") String status,
            @Param("viewerId") Long viewerId,
            @Param("cursorScore") Long cursorScore,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
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
