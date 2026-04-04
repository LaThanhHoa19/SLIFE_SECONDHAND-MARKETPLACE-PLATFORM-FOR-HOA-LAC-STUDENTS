package com.slife.marketplace.repository;
import com.slife.marketplace.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository 
public interface DealRepository extends JpaRepository<Deal, Long> {

    Optional<Deal> findFirstByListing_IdAndProposedBy_IdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long listingId, Long proposedById, String status);
    long countByStatusAndDeletedAtIsNull(String status);

    Optional<Deal> findByIdAndDeletedAtIsNull(Long id);
    List<Deal> findByStatusAndUpdatedAtBeforeAndDeletedAtIsNull(String status, LocalDateTime updatedAt);

    List<Deal> findByProposedBy_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long proposedById);

    List<Deal> findByListing_Seller_IdAndDeletedAtIsNullOrderByCreatedAtDesc(Long sellerId);

    /** Số giao dịch mới mỗi ngày trong N ngày gần nhất. */
    @Query(value = """
            SELECT DATE(d.created_at) AS day, COUNT(*) AS cnt
            FROM deals d
            WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              AND d.deleted_at IS NULL
            GROUP BY DATE(d.created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> countDealsByDayLast(@Param("days") int days);
}