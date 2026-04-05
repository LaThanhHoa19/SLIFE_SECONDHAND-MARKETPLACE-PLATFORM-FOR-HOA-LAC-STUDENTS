package com.slife.marketplace.repository;

import com.slife.marketplace.entity.CommunityPostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CommunityPostCommentRepository extends JpaRepository<CommunityPostComment, Long> {

    List<CommunityPostComment> findByPost_IdOrderByCreatedAtAsc(Long postId);

    long countByPost_IdAndDeletedAtIsNull(Long postId);

    @Query("SELECT c.post.id, COUNT(c) FROM CommunityPostComment c WHERE c.post.id IN :ids AND c.deletedAt IS NULL GROUP BY c.post.id")
    List<Object[]> countCommentsByPostIds(@Param("ids") Collection<Long> ids);
}
