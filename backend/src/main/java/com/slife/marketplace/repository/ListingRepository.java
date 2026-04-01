package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
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
              AND (
                  :itemCond IS NULL OR :itemCond = ''
                  OR l.itemCondition = :itemCond
                  OR (
                      :itemCond = 'USED'
                      AND l.itemCondition IN ('USED_LIKE_NEW', 'USED_GOOD', 'USED_FAIR')
                  )
              )
              AND (:priceMin   IS NULL OR l.price >= :priceMin)
              AND (:priceMax   IS NULL OR l.price <= :priceMax)
              AND (
                  :q IS NULL OR :q = ''
                  OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
                  OR l.description  LIKE CONCAT('%', :q, '%')
              )
            """)
    Page<Listing> findByFilters(
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("location") String location,
            @Param("purpose") String purpose,
            @Param("itemCond") String itemCond,
            @Param("priceMin") BigDecimal priceMin,
            @Param("priceMax") BigDecimal priceMax,
            Pageable pageable);

    /**
     * Optimized query for Listing Cards.
     * Uses Constructor Projection to fetch only required fields.
     * Field order MUST match ListingCardResponse @AllArgsConstructor declaration.
     */
    @Query("""
                SELECT new com.slife.marketplace.dto.response.ListingCardResponse(
                    l.id, l.title, l.price,
                    CASE
                        WHEN a IS NULL THEN NULL
                        WHEN a.locationName IS NOT NULL AND a.locationName <> '' AND a.addressText IS NOT NULL AND a.addressText <> ''
                            THEN CONCAT(a.locationName, ' \u2014 ', a.addressText)
                        WHEN a.locationName IS NOT NULL AND a.locationName <> '' THEN a.locationName
                        ELSE a.addressText
                    END,
                    l.status,
                    (SELECT img.imageUrl FROM ListingImage img WHERE img.listing = l ORDER BY img.displayOrder ASC LIMIT 1),
                    l.itemCondition,
                    l.purpose,
                    l.isGiveaway,
                    l.createdAt,
                    l.seller.id,
                    l.seller.fullName,
                    l.seller.avatarUrl,
                    false,
                    false,
                    (SELECT COUNT(ll) FROM ListingLike ll WHERE ll.listing = l),
                    false,
                    (SELECT COUNT(c) FROM Comment c WHERE c.listing = l AND c.deletedAt IS NULL)
                )
                FROM Listing l
                LEFT JOIN l.pickupAddress a
                WHERE l.status = 'ACTIVE'
                  AND (:sellerId IS NULL OR l.seller.id = :sellerId)
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findAllActiveListingCards(
            @Param("sellerId") Long sellerId,
            Pageable pageable);

    long countByStatus(String status);

    /**
     * Top danh mục theo số tin ACTIVE (dùng Pageable để giới hạn N).
     */
    @Query("""
            SELECT new com.slife.marketplace.dto.response.CategoryStatDto(
                c.id,
                c.name,
                COUNT(l)
            )
            FROM Listing l JOIN l.category c
            WHERE l.status = 'ACTIVE'
            GROUP BY c.id, c.name
            ORDER BY COUNT(l) DESC
            """)
    java.util.List<com.slife.marketplace.dto.response.CategoryStatDto> findTopCategoryStatsByActiveListings(
            Pageable pageable);

    long countBySeller_IdAndStatus(Long sellerId, String status);

    /** Distinct pickup locations for filter dropdown */
    @Query("SELECT DISTINCT a.locationName FROM Listing l JOIN l.pickupAddress a " +
            "WHERE a.locationName IS NOT NULL AND a.locationName <> ''")
    List<String> findDistinctPickupLocationNames();

    // --- My Listings Management (pageable versions) ---

    Page<Listing> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<Listing> findBySellerAndStatus(User seller, String status, Pageable pageable);

    /**
     * Tin hết hạn theo ngày (kể cả HIDDEN nếu đã quá expirationDate) — tránh trùng tab với {@link #findHiddenNotExpiredBySeller}.
     */
    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND l.expirationDate IS NOT NULL AND l.expirationDate < CURRENT_TIMESTAMP " +
            "ORDER BY l.expirationDate DESC")
    Page<Listing> findExpiredListingsBySeller(@Param("seller") User seller, Pageable pageable);

    /**
     * Tab "Đã ẩn": chỉ HIDDEN và chưa quá hạn (null expiration hoặc expirationDate &gt;= hiện tại).
     * Tin HIDDEN nhưng expirationDate đã qua chỉ hiển thị ở tab hết hạn.
     */
    @Query("SELECT l FROM Listing l WHERE l.seller = :seller AND l.status = 'HIDDEN' " +
            "AND (l.expirationDate IS NULL OR l.expirationDate >= CURRENT_TIMESTAMP)")
    Page<Listing> findHiddenNotExpiredBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND EXISTS (SELECT r FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = l.id) " +
            "ORDER BY l.createdAt DESC")
    Page<Listing> findReportedListingsBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = :listingId")
    long countReportsByListingId(@Param("listingId") Long listingId);
}
