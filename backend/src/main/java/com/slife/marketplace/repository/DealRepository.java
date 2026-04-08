package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository 
public interface DealRepository extends JpaRepository<Deal, Long> {

    @EntityGraph(attributePaths = {"listing", "listing.seller", "proposedBy", "conversation", "offer", "address"})
    Optional<Deal> findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long listingId, Long proposedById, String status);
    long countByStatusAndDeletedAtIsNull(String status);

    @EntityGraph(attributePaths = {"listing", "listing.seller", "proposedBy", "conversation", "offer", "address"})
    Optional<Deal> findByIdAndDeletedAtIsNull(Long id);
    List<Deal> findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(String status, LocalDateTime updatedAt);

    List<Deal> findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long proposedById);

    List<Deal> findByListing_Seller_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long sellerId);

    // Tìm deal cần tự động hoàn tất (theo status và thời gian tạo)
    List<Deal> findAllByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);

    // Tìm deal cần tự động hoàn tất (theo status và thời gian xác nhận)
    List<Deal> findAllByStatusAndConfirmedAtBefore(String status, LocalDateTime confirmedAt);

    /** Số giao dịch mới mỗi ngày trong N ngày gần nhất. */
    @Query(value = """
            SELECT DATE(d.created_at) AS day, COUNT(*) AS cnt
            FROM deals d
            WHERE d.created_at >= DATE_SUB(UTC_TIMESTAMP() + INTERVAL 7 HOUR, INTERVAL :days DAY)
              AND d.deleted_at IS NULL
            GROUP BY DATE(d.created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> countDealsByDayLast(@Param("days") int days);

    /**
     * Deal có giờ giao, chưa gửi nhắc, pickup trong khoảng [lower, upper] (tính theo mốc "còn ~3 giờ").
     */
    @EntityGraph(attributePaths = {"listing", "listing.seller", "proposedBy"})
    @Query("""
            SELECT d FROM Deal d
            WHERE d.deletedAt IS NULL
              AND d.reminderSent = false
              AND d.pickupTime IS NOT NULL
              AND d.status IN ('PENDING', 'CONFIRMED')
              AND d.pickupTime >= :lower
              AND d.pickupTime <= :upper
            """)
    List<Deal> findDealsForPickupReminder(@Param("lower") LocalDateTime lower, @Param("upper") LocalDateTime upper);
}