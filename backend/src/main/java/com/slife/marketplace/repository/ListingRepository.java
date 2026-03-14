package com.slife.marketplace.repository;

import com.slife.marketplace.entity.Listing;
import com.slife.marketplace.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    // --- Basic & Seller Management ---

    // Retains Hoa's simplified pageable status lookup
    Page<Listing> findByStatus(String status, Pageable pageable);

    // UC-01, UC-12, UC-13: Seller dashboard filters
    List<Listing> findBySellerAndStatus(User seller, String status);

    List<Listing> findBySellerOrderByCreatedAtDesc(User seller);

    List<Listing> findBySeller(User seller);

    // --- Public Feed & Derived Queries ---

    // UC-32: Filter combinations for fast lookup
    List<Listing> findByStatusAndCategory_IdAndPickupAddress_LocationNameOrderByCreatedAtDesc(
            String status, Long categoryId, String locationName);
            
    List<Listing> findByStatusAndCategory_IdOrderByCreatedAtDesc(String status, Long categoryId);
    
    List<Listing> findByStatusAndPickupAddress_LocationNameOrderByCreatedAtDesc(String status, String locationName);

    // UC-35: Giveaway items (Price = 0)
    @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND l.price = 0")
    Page<Listing> findGiveawayListings(Pageable pageable);

    // --- Advanced Search (The "Engine" of the Marketplace) ---

    /**
     * UC-34: Search with Filters (Category, Location, Keyword)
     * Supports pagination (NFR-P2: 10-20 items/page)
     */
    @Query("SELECT l FROM Listing l " +
            "LEFT JOIN l.category c " +
            "LEFT JOIN l.pickupAddress a " +
            "WHERE l.status = 'ACTIVE' " +
            "AND (:categoryId IS NULL OR c.id = :categoryId) " +
            "AND (:location IS NULL OR :location = '' OR LOWER(a.locationName) LIKE LOWER(CONCAT('%', :location, '%'))) " +
            "AND (:q IS NULL OR :q = '' OR l.title LIKE CONCAT('%', :q, '%') " +
            "     OR l.description LIKE CONCAT('%', :q, '%'))")
    Page<Listing> findByFilters(@Param("categoryId") Long categoryId,
                                @Param("location") String location,
                                @Param("q") String q,
                                Pageable pageable);

    // Helper for UI filter dropdowns
    @Query("SELECT DISTINCT a.locationName FROM Listing l " +
            "JOIN l.pickupAddress a " +
            "WHERE l.status = 'ACTIVE' " +
            "ORDER BY a.locationName")
    List<String> findDistinctPickupLocationNames();

    // --- My Listings Management (pageable versions) ---

    Page<Listing> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<Listing> findBySellerAndStatus(User seller, String status, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND l.expirationDate IS NOT NULL AND l.expirationDate < CURRENT_TIMESTAMP " +
            "ORDER BY l.expirationDate DESC")
    Page<Listing> findExpiredListingsBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.seller = :seller " +
            "AND EXISTS (SELECT r FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = l.id) " +
            "ORDER BY l.createdAt DESC")
    Page<Listing> findReportedListingsBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.targetType = 'LISTING' AND r.targetId = :listingId")
    long countReportsByListingId(@Param("listingId") Long listingId);
}