package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Hashtag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {

    Optional<Hashtag> findByTag(String tag);

    List<Hashtag> findByTagStartingWithOrderByTagAsc(String prefix, Pageable pageable);

    @Query(value = """
            SELECT h.tag AS tag, COUNT(DISTINCT p.post_id) AS cnt
            FROM community_posts p
            INNER JOIN community_post_hashtags cph ON cph.post_id = p.post_id
            INNER JOIN hashtags h ON h.hashtag_id = cph.hashtag_id
            WHERE p.status = 'ACTIVE'
              AND p.deleted_at IS NULL
              AND p.hidden_at IS NULL
              AND p.created_at >= :since
            GROUP BY h.hashtag_id, h.tag
            ORDER BY cnt DESC, h.tag ASC
            LIMIT :lim
            """, nativeQuery = true)
    List<Object[]> findTrendingTagsRaw(@Param("since") Instant since, @Param("lim") int lim);
}
