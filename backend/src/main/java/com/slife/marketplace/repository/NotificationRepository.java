package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT n
            FROM Notification n
            WHERE n.user.id = :userId
              AND (
                   :cursorCreatedAt IS NULL
                   OR n.createdAt < :cursorCreatedAt
                   OR (n.createdAt = :cursorCreatedAt AND n.id < :cursorId)
              )
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> findPageByUser(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
            SELECT n
            FROM Notification n
            WHERE n.user.id = :userId
              AND (:q IS NULL OR :q = '' OR n.content LIKE CONCAT('%', :q, '%'))
              AND (
                   :cursorCreatedAt IS NULL
                   OR n.createdAt < :cursorCreatedAt
                   OR (n.createdAt = :cursorCreatedAt AND n.id < :cursorId)
              )
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> searchPageByUser(
            @Param("userId") Long userId,
            @Param("q") String q,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            org.springframework.data.domain.Pageable pageable
    );

    long countByUser_IdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllReadForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.user.id = :userId")
    int markReadForUser(@Param("id") Long id, @Param("userId") Long userId);
}
