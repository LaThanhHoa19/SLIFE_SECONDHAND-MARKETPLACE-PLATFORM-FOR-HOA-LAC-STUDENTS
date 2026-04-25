package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * SCRUM-43: Listing search repository.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    /**
     * Keyword search + multi-filter.
     * Chỉ listing {@code ACTIVE}, chưa soft-delete, chưa quá hạn hiển thị (lazy expiry —
     * đồng bộ với cron batch).
     */
    @Query(value = """
            SELECT l
            FROM Listing l
            LEFT JOIN l.category c
            LEFT JOIN l.pickupAddress a
            WHERE l.status = 'ACTIVE'
              AND l.deletedAt IS NULL
              AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:location IS NULL OR :location = '' OR LOWER(a.locationName) LIKE LOWER(CONCAT('%', :location, '%')))
              AND (:purpose IS NULL OR :purpose = '' OR l.purpose = :purpose)
              AND (
                  :itemCond IS NULL OR :itemCond = ''
                  OR l.itemCondition = :itemCond
                  OR (
                      :itemCond = 'USED'
                      AND l.itemCondition IN ('USED_LIKE_NEW', 'USED_GOOD', 'USED_FAIR')
                  )
              )
              AND (:priceMin IS NULL OR l.price >= :priceMin)
              AND (:priceMax IS NULL OR l.price <= :priceMax)
              AND (
                  :q IS NULL OR :q = ''
                  OR LOWER(l.title) LIKE LOWER(CONCAT(:searchPrefix, '%'))
              )
            """)
    Page<Listing> findByFilters(
            @Param("q") String q,
            @Param("searchPrefix") String searchPrefix,
            @Param("categoryId") Long categoryId,
            @Param("location") String location,
            @Param("purpose") String purpose,
            @Param("itemCond") String itemCond,
            @Param("priceMin") BigDecimal priceMin,
            @Param("priceMax") BigDecimal priceMax,
            @Param("now") Instant now,
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
                  AND l.deletedAt IS NULL
                  AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
                  AND (:sellerId IS NULL OR l.seller.id = :sellerId)
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findAllActiveListingCards(
            @Param("sellerId") Long sellerId,
            @Param("now") Instant now,
            Pageable pageable);

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
                  AND l.deletedAt IS NULL
                  AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
                  AND (:sellerId IS NULL OR l.seller.id = :sellerId)
                  AND (l.purpose = 'GIVEAWAY' OR l.isGiveaway = true)
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findGiveawayActiveListingCards(
            @Param("sellerId") Long sellerId,
            @Param("now") Instant now,
            Pageable pageable);

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
                WHERE l.seller.id = :sellerId
                  AND l.status = :status
                  AND l.deletedAt IS NULL
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findListingCardsBySellerAndStatus(
            @Param("sellerId") Long sellerId,
            @Param("status") String status,
            Pageable pageable);

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
                  AND l.deletedAt IS NULL
                  AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
                  AND (:sellerId IS NULL OR l.seller.id = :sellerId)
                ORDER BY (SELECT COUNT(ll) FROM ListingLike ll WHERE ll.listing = l) DESC, l.createdAt DESC
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findPopularActiveListingCards(
            @Param("sellerId") Long sellerId,
            @Param("now") Instant now,
            Pageable pageable);

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
                  AND l.deletedAt IS NULL
                  AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
                  AND l.seller.id IN :sellerIds
            """)
    Page<com.slife.marketplace.dto.response.ListingCardResponse> findFollowingActiveListingCards(
            @Param("sellerIds") java.util.Collection<Long> sellerIds,
            @Param("now") Instant now,
            Pageable pageable);

    long countByStatus(String status);

    /** Số tin đăng mới mỗi ngày trong N ngày gần nhất. */
    @Query(value = """
            SELECT DATE(l.created_at) AS day, COUNT(*) AS cnt
            FROM listings l
            WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              AND l.deleted_at IS NULL
            GROUP BY DATE(l.created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    java.util.List<Object[]> countListingsByDayLast(@Param("days") int days);

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
              AND l.deletedAt IS NULL
              AND (l.expirationDate IS NULL OR l.expirationDate >= :now)
            GROUP BY c.id, c.name
            ORDER BY COUNT(l) DESC
            """)
    java.util.List<com.slife.marketplace.dto.response.CategoryStatDto> findTopCategoryStatsByActiveListings(
            @Param("now") Instant now,
            Pageable pageable);

    long countBySeller_IdAndStatus(Long sellerId, String status);

    long countBySeller_IdAndStatusAndDeletedAtIsNull(Long sellerId, String status);

    /**
     * Địa điểm gợi ý filter: chỉ từ tin ACTIVE hiển thị được (chưa xóa mềm, chưa quá hạn lazy).
     */
    @Query("SELECT DISTINCT a.locationName FROM Listing l JOIN l.pickupAddress a " +
            "WHERE l.status = 'ACTIVE' AND l.deletedAt IS NULL " +
            "AND (l.expirationDate IS NULL OR l.expirationDate >= :now) " +
            "AND a.locationName IS NOT NULL AND a.locationName <> ''")
    List<String> findDistinctPickupLocationNames(@Param("now") Instant now);

    // --- My Listings Management (pageable versions) ---

    Page<Listing> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<Listing> findBySellerAndStatus(User seller, String status, Pageable pageable);

    /**
     * Nhiều status, không lọc theo expirationDate (dùng khi cần đủ mọi tin trong các status đó).
     * Tab "Đã ẩn" của My Listings nên dùng {@link #findHiddenNotExpiredBySeller} hoặc
     * {@link #findBySellerAndStatusInAndNotExpiredWhen} với {@code notExpiredOnly = true}.
     */
    Page<Listing> findBySellerAndStatusIn(User seller, List<String> statuses, Pageable pageable);

    /**
     * Seller + danh sách status + tùy chọn lọc "chưa hết hạn" ({@code expirationDate} null hoặc &gt;= hiện tại).
     * {@code notExpiredOnly = false} → hành vi gần giống {@link #findBySellerAndStatusIn}.
     * {@code notExpiredOnly = true} → thêm điều kiện ngày (dùng cho tab Đã ẩn, tránh trùng EXPIRED).
     */
    @Query("SELECT l FROM Listing l WHERE l.seller = :seller AND l.status IN :statuses AND "
            + "((:notExpiredOnly) = false OR l.expirationDate IS NULL OR l.expirationDate >= CURRENT_TIMESTAMP)")
    Page<Listing> findBySellerAndStatusInAndNotExpiredWhen(
            @Param("seller") User seller,
            @Param("statuses") List<String> statuses,
            @Param("notExpiredOnly") boolean notExpiredOnly,
            Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND l.status NOT IN ('SOLD', 'BANNED', 'DELETED') " +
            "AND l.expirationDate IS NOT NULL AND l.expirationDate < CURRENT_TIMESTAMP " +
            "AND l.deletedAt IS NULL " +
            "ORDER BY l.expirationDate DESC")
    Page<Listing> findExpiredListingsBySeller(@Param("seller") User seller, Pageable pageable);

    /** ID tin ACTIVE đã quá hạn, ưu tiên hết hạn lâu nhất trước (batch job). */
    @Query("SELECT l.id FROM Listing l WHERE l.status = 'ACTIVE' "
            + "AND l.expirationDate IS NOT NULL AND l.expirationDate < :now AND l.deletedAt IS NULL "
            + "ORDER BY l.expirationDate ASC")
    List<Long> findIdsOfActiveExpiredListings(@Param("now") Instant now, Pageable pageable);

    /** Tin ACTIVE sẽ hết hạn trong cửa sổ thời gian chỉ định. */
    @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' "
            + "AND l.deletedAt IS NULL "
            + "AND l.expirationDate IS NOT NULL "
            + "AND l.expirationDate >= :from AND l.expirationDate < :to")
    List<Listing> findActiveListingsExpiringBetween(@Param("from") Instant from, @Param("to") Instant to);

    /**
     * Batch: {@code HIDDEN} theo danh sách ID (chỉ khi vẫn {@code ACTIVE} để an toàn khi chạy song song).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Listing l SET l.status = 'HIDDEN', l.updatedAt = :now WHERE l.id IN :ids "
            + "AND l.status = 'ACTIVE' AND l.expirationDate IS NOT NULL AND l.expirationDate < :now "
            + "AND l.deletedAt IS NULL")
    int hideExpiredActiveListingsByIds(@Param("ids") List<Long> ids, @Param("now") Instant now);

    /**
     * Tab "Đã ẩn": HIDDEN + MOD_HIDDEN và chưa quá hạn — uỷ quyền cho
     * {@link #findBySellerAndStatusInAndNotExpiredWhen} (một nguồn điều kiện ngày).
     */
    default Page<Listing> findHiddenNotExpiredBySeller(User seller, Pageable pageable) {
        return findBySellerAndStatusInAndNotExpiredWhen(
                seller, List.of("HIDDEN", "MOD_HIDDEN"), true, pageable);
    }

    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND EXISTS (SELECT r FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = l.id) " +
            "ORDER BY l.createdAt DESC")
    Page<Listing> findReportedListingsBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = :listingId")
    long countReportsByListingId(@Param("listingId") Long listingId);

    /**
     * Khóa pessimistic khi xử lý chốt đơn / chấp nhận để tránh race nhiều deal cùng tin.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Listing l WHERE l.id = :id AND l.deletedAt IS NULL")
    Optional<Listing> findByIdAndDeletedAtIsNullForUpdate(@Param("id") Long id);
}
