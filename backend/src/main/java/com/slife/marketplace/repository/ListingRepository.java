package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * SCRUM-43: Listing search repository.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    /**
     * Keyword search + multi-filter.
     * Chi tra ve listing co status = ACTIVE.
     */
    @Query(value = """
        SELECT l
        FROM Listing l
        LEFT JOIN l.category c
        LEFT JOIN l.pickupAddress a
        WHERE l.status = 'ACTIVE'
          AND (:categoryId IS NULL OR c.id           = :categoryId)
          AND (:location   IS NULL OR :location = '' OR LOWER(a.locationName) LIKE LOWER(CONCAT('%', :location, '%')))
          AND (:purpose    IS NULL OR :purpose = ''  OR l.purpose      = :purpose)
          AND (:itemCond   IS NULL OR :itemCond = '' OR l.itemCondition = :itemCond)
          AND (:priceMin   IS NULL OR l.price >= :priceMin)
          AND (:priceMax   IS NULL OR l.price <= :priceMax)
          AND (
              :q IS NULL OR :q = ''
              OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
              OR l.description  LIKE CONCAT('%', :q, '%')
          )
        """)
    Page<Listing> findByFilters(
            @Param("q")          String q,
            @Param("categoryId") Long categoryId,
            @Param("location")   String location,
            @Param("purpose")    String purpose,
            @Param("itemCond")   String itemCond,
            @Param("priceMin")   BigDecimal priceMin,
            @Param("priceMax")   BigDecimal priceMax,
            Pageable pageable);

    /** Distinct pickup locations for filter dropdown */
    @Query("SELECT DISTINCT a.locationName FROM Listing l JOIN l.pickupAddress a " +
           "WHERE a.locationName IS NOT NULL AND a.locationName <> ''")
    List<String> findDistinctPickupLocationNames();
}