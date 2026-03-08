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

    // UC-01, UC-12, UC-13: Xem danh sách bài đăng của chính Seller theo trạng thái
    List<Listing> findBySellerAndStatus(User seller, String status);

    // Dành cho Seller Dashboard: Lấy tất cả bài đăng của một Seller
    List<Listing> findBySellerOrderByCreatedAtDesc(User seller);

    // UC-32: Xem các bài đăng đang hoạt động (Active) trên Feed chung
    List<Listing> findByStatusOrderByCreatedAtDesc(String status);

    // UC-35: Tìm kiếm các sản phẩm Giveaway (Giá = 0)
    @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND l.price = 0")
    Page<Listing> findGiveawayListings(Pageable pageable);

    // UC-34: Tìm kiếm nâng cao với Filter (Category, Location, Keyword)
    // NFR-P2: Hỗ trợ phân trang 10-20 item/page
    @Query("SELECT l FROM Listing l " +
            "LEFT JOIN FETCH l.category " +
            "LEFT JOIN FETCH l.pickupAddress " +
            "WHERE l.status = 'ACTIVE' " +
            "AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
            "AND (:location IS NULL OR :location = '' OR (l.pickupAddress IS NOT NULL AND l.pickupAddress.locationName = :location)) " +
            "AND (:q IS NULL OR :q = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(l.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Listing> findByFilters(@Param("categoryId") Long categoryId,
                                @Param("location") String location,
                                @Param("q") String q,
                                Pageable pageable);

    // Lấy danh sách địa điểm phục vụ Filter
    @Query("SELECT DISTINCT l.pickupAddress.locationName FROM Listing l " +
            "WHERE l.pickupAddress IS NOT NULL AND l.status = 'ACTIVE' " +
            "ORDER BY l.pickupAddress.locationName")
    List<String> findDistinctPickupLocationNames();
}