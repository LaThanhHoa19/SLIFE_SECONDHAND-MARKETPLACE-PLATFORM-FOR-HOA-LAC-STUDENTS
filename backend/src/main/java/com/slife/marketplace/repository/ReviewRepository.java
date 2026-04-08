/**
 * Mục đích: Repository ReviewRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByConversation_IdAndReviewer_Id(Long conversationId, Long reviewerId);

    // Kiểm tra xem đã có đánh giá nào được tạo sau mốc thời gian cụ thể hay chưa
    boolean existsByConversation_IdAndReviewer_IdAndCreatedAtAfter(Long conversationId, Long reviewerId, Instant after);

    /** JPQL rõ ràng — tránh lỗi Hibernate 6 (vd. Illegal pop) với derived exists + Instant. */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Review r WHERE r.conversation.id = :convId AND r.reviewer.id = :reviewerId AND r.createdAt > :after")
    boolean existsReviewCreatedAfter(@Param("convId") Long convId, @Param("reviewerId") Long reviewerId, @Param("after") Instant after);

    // Lấy danh sách đánh giá của một người dùng
    java.util.List<Review> findByReviewee_IdOrderByCreatedAtDesc(Long revieweeId);

    long countByReviewee_Id(Long revieweeId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :revieweeId")
    Double findAverageRatingByReviewee_Id(@org.springframework.data.repository.query.Param("revieweeId") Long revieweeId);
}