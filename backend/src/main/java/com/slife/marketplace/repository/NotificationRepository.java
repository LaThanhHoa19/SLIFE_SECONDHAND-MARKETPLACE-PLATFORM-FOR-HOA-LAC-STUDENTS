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
                   :scope = 'ALL'
                   OR (:scope = 'COMMUNITY' AND UPPER(COALESCE(n.refType, '')) = 'COMMUNITY_POST')
                   OR (:scope = 'MARKET' AND UPPER(COALESCE(n.refType, '')) <> 'COMMUNITY_POST')
              )
              AND (
                   :readFilter = 'ALL'
                   OR (:readFilter = 'READ' AND n.isRead = true)
                   OR (:readFilter = 'UNREAD' AND n.isRead = false)
              )
              AND (
                   :typeFilter = 'ALL'
                   OR (:typeFilter = 'SYSTEM' AND UPPER(COALESCE(n.type, '')) = 'SYSTEM')
                   OR (:typeFilter = 'DEAL' AND UPPER(COALESCE(n.type, '')) = 'DEAL')
                   OR (:typeFilter = 'SOCIAL' AND (
                        UPPER(COALESCE(n.refType, '')) = 'SELLER_PROFILE'
                        OR UPPER(COALESCE(n.type, '')) IN ('FOLLOW', 'LIKE', 'COMMENT')
                   ))
                   OR (:typeFilter = 'LISTING' AND (
                        UPPER(COALESCE(n.refType, '')) = 'LISTING'
                        OR UPPER(COALESCE(n.type, '')) = 'REPORT'
                   ))
                   OR (:typeFilter = 'OTHER' AND NOT (
                        UPPER(COALESCE(n.type, '')) = 'SYSTEM'
                        OR UPPER(COALESCE(n.type, '')) = 'DEAL'
                        OR UPPER(COALESCE(n.refType, '')) = 'SELLER_PROFILE'
                        OR UPPER(COALESCE(n.type, '')) IN ('FOLLOW', 'LIKE', 'COMMENT')
                        OR UPPER(COALESCE(n.refType, '')) = 'LISTING'
                        OR UPPER(COALESCE(n.type, '')) = 'REPORT'
                   ))
              )
              AND (
                   :cursorCreatedAt IS NULL
                   OR n.createdAt < :cursorCreatedAt
                   OR (n.createdAt = :cursorCreatedAt AND n.id < :cursorId)
              )
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> findPageByUser(
            @Param("userId") Long userId,
            @Param("scope") String scope,
            @Param("readFilter") String readFilter,
            @Param("typeFilter") String typeFilter,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
            SELECT n
            FROM Notification n
            WHERE n.user.id = :userId
              AND (
                   :scope = 'ALL'
                   OR (:scope = 'COMMUNITY' AND UPPER(COALESCE(n.refType, '')) = 'COMMUNITY_POST')
                   OR (:scope = 'MARKET' AND UPPER(COALESCE(n.refType, '')) <> 'COMMUNITY_POST')
              )
              AND (:q IS NULL OR :q = '' OR n.content LIKE CONCAT('%', :q, '%'))
              AND (
                   :readFilter = 'ALL'
                   OR (:readFilter = 'READ' AND n.isRead = true)
                   OR (:readFilter = 'UNREAD' AND n.isRead = false)
              )
              AND (
                   :typeFilter = 'ALL'
                   OR (:typeFilter = 'SYSTEM' AND UPPER(COALESCE(n.type, '')) = 'SYSTEM')
                   OR (:typeFilter = 'DEAL' AND UPPER(COALESCE(n.type, '')) = 'DEAL')
                   OR (:typeFilter = 'SOCIAL' AND (
                        UPPER(COALESCE(n.refType, '')) = 'SELLER_PROFILE'
                        OR UPPER(COALESCE(n.type, '')) IN ('FOLLOW', 'LIKE', 'COMMENT')
                   ))
                   OR (:typeFilter = 'LISTING' AND (
                        UPPER(COALESCE(n.refType, '')) = 'LISTING'
                        OR UPPER(COALESCE(n.type, '')) = 'REPORT'
                   ))
                   OR (:typeFilter = 'OTHER' AND NOT (
                        UPPER(COALESCE(n.type, '')) = 'SYSTEM'
                        OR UPPER(COALESCE(n.type, '')) = 'DEAL'
                        OR UPPER(COALESCE(n.refType, '')) = 'SELLER_PROFILE'
                        OR UPPER(COALESCE(n.type, '')) IN ('FOLLOW', 'LIKE', 'COMMENT')
                        OR UPPER(COALESCE(n.refType, '')) = 'LISTING'
                        OR UPPER(COALESCE(n.type, '')) = 'REPORT'
                   ))
              )
              AND (
                   :cursorCreatedAt IS NULL
                   OR n.createdAt < :cursorCreatedAt
                   OR (n.createdAt = :cursorCreatedAt AND n.id < :cursorId)
              )
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> searchPageByUser(
            @Param("userId") Long userId,
            @Param("scope") String scope,
            @Param("q") String q,
            @Param("readFilter") String readFilter,
            @Param("typeFilter") String typeFilter,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE n.user.id = :userId
              AND n.isRead = false
              AND (
                   :scope = 'ALL'
                   OR (:scope = 'COMMUNITY' AND UPPER(COALESCE(n.refType, '')) = 'COMMUNITY_POST')
                   OR (:scope = 'MARKET' AND UPPER(COALESCE(n.refType, '')) <> 'COMMUNITY_POST')
              )
            """)
    long countUnreadByScope(@Param("userId") Long userId, @Param("scope") String scope);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.user.id = :userId
              AND n.isRead = false
              AND (
                   :scope = 'ALL'
                   OR (:scope = 'COMMUNITY' AND UPPER(COALESCE(n.refType, '')) = 'COMMUNITY_POST')
                   OR (:scope = 'MARKET' AND UPPER(COALESCE(n.refType, '')) <> 'COMMUNITY_POST')
              )
            """)
    int markAllReadForUser(@Param("userId") Long userId, @Param("scope") String scope);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.id = :id
              AND n.user.id = :userId
              AND (
                   :scope = 'ALL'
                   OR (:scope = 'COMMUNITY' AND UPPER(COALESCE(n.refType, '')) = 'COMMUNITY_POST')
                   OR (:scope = 'MARKET' AND UPPER(COALESCE(n.refType, '')) <> 'COMMUNITY_POST')
              )
            """)
    int markReadForUser(@Param("id") Long id, @Param("userId") Long userId, @Param("scope") String scope);
}
