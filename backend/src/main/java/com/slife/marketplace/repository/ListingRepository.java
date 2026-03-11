package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * SCRUM-43: Listing search repository.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    /**
     * Keyword search by title/description with optional category & location filters.
     * Only returns listings with status = 'ACTIVE'.
     */
    @Query(value = """
        SELECT l
        FROM Listing l
        LEFT JOIN l.category c
        LEFT JOIN l.pickupAddress a
        WHERE l.status = 'ACTIVE'
          AND (:categoryId IS NULL OR c.id = :categoryId)
          AND (:location IS NULL OR :location = '' OR LOWER(a.locationName) LIKE LOWER(CONCAT('%', :location, '%')))
          AND (
              :q IS NULL OR :q = ''
              OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
              OR l.description LIKE CONCAT('%', :q, '%')
          )
        """)
    Page<Listing> findByFilters(@Param("q") String q,
                                @Param("categoryId") Long categoryId,
                                @Param("location") String location,
                                Pageable pageable);

    /**
     * Distinct pickup locations for filter dropdown.
     */
    @Query("SELECT DISTINCT a.locationName FROM Listing l JOIN l.pickupAddress a " +
           "WHERE a.locationName IS NOT NULL AND a.locationName <> ''")
    java.util.List<String> findDistinctPickupLocationNames();
}
