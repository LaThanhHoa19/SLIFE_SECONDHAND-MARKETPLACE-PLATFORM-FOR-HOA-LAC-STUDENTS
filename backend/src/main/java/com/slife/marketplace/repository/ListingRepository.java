/**
 * Mục đích: Repository ListingRepository
 * Endpoints liên quan: service
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findByStatusOrderByCreatedAtDesc(String status);

    List<Listing> findByStatusAndCategory_IdOrderByCreatedAtDesc(String status, Long categoryId);

    List<Listing> findByStatusAndPickupAddress_LocationNameOrderByCreatedAtDesc(String status, String locationName);

    List<Listing> findByStatusAndCategory_IdAndPickupAddress_LocationNameOrderByCreatedAtDesc(String status, Long categoryId, String locationName);

    @Query("SELECT DISTINCT l.pickupAddress.locationName FROM Listing l " +
            "WHERE l.pickupAddress IS NOT NULL AND l.status = 'ACTIVE' " +
            "ORDER BY l.pickupAddress.locationName")
    List<String> findDistinctPickupLocationNames();

    @Query("SELECT l FROM Listing l " +
            "LEFT JOIN FETCH l.category " +
            "LEFT JOIN FETCH l.pickupAddress " +
            "WHERE l.status = 'ACTIVE' " +
            "AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
            "AND (:location IS NULL OR :location = '' OR (l.pickupAddress IS NOT NULL AND l.pickupAddress.locationName = :location)) " +
            "AND (:q IS NULL OR :q = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(l.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Listing> findByFilters(@Param("categoryId") Long categoryId,
                                @Param("location") String location,
                                @Param("q") String q,
                                Pageable pageable);
}