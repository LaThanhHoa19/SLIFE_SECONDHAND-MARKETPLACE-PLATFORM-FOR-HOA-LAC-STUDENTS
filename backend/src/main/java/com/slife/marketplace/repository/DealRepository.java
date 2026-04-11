package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository 
public interface DealRepository extends JpaRepository<Deal, Long> {

    @EntityGraph(attributePaths = {"listing", "listing.seller", "proposedBy", "conversation", "offer", "address"})
    Optional<Deal> findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long listingId, Long proposedById, String status);

    List<Deal> findByListing_IdAndDeletedAtIsNullAndStatus(Long listingId, String status);

    @Query("""
            SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Deal d
            WHERE d.listing.id = :listingId AND d.deletedAt IS NULL AND d.status IN :statuses
            """)
    boolean existsByListing_IdAndDeletedAtIsNullAndStatusIn(
            @Param("listingId") Long listingId, @Param("statuses") Collection<String> statuses);

    /** Deal khác (không phải excludeId) đang ở trạng thái đã chiếm tin (COMPLETED/CONFIRMED/SUCCESS). */
    @Query("""
            SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Deal d
            WHERE d.listing.id = :listingId AND d.deletedAt IS NULL AND d.id <> :excludeDealId
              AND d.status IN :statuses
            """)
    boolean existsOtherDealInStatuses(
            @Param("listingId") Long listingId,
            @Param("excludeDealId") Long excludeDealId,
            @Param("statuses") Collection<String> statuses);

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
     * Deal cần gửi email nhắc nhận hàng:
     * <ul>
     *   <li>Trường hợp thường: {@code pickupTime} trong [lower, upper] quanh mốc {@code now + H} (±7 phút).</li>
     *   <li>Bù lịch: còn &lt; H giờ nữa là tới {@code pickupTime} (nhỏ hơn config) thì vẫn gửi ở lần quét kế
     *       (đã lỡ mốc “H giờ trước giờ giao”).</li>
     * </ul>
     * Chỉ pickup chưa qua ({@code pickupTime > now}). Không gồm PENDING.
     */
    @EntityGraph(attributePaths = {"listing", "listing.seller", "proposedBy"})
    @Query("""
            SELECT d FROM Deal d
            WHERE d.deletedAt IS NULL
              AND d.reminderSent = false
              AND d.pickupTime IS NOT NULL
              AND d.status IN ('CONFIRMED', 'COMPLETED')
              AND d.pickupTime > :now
              AND (
                (d.pickupTime >= :lower AND d.pickupTime <= :upper)
                OR (d.pickupTime < :nowPlusH)
              )
            """)
    List<Deal> findDealsForPickupReminder(
            @Param("now") LocalDateTime now,
            @Param("lower") LocalDateTime lower,
            @Param("upper") LocalDateTime upper,
            @Param("nowPlusH") LocalDateTime nowPlusH);
}