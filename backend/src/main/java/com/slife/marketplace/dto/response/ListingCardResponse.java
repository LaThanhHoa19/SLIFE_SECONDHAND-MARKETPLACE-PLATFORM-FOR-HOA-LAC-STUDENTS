package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingCardResponse {
    private Long id;
    private String title;
    private BigDecimal price;
    private String location;
    private String status;
    private String thumbnailUrl;

    /** Danh sách URL ảnh (theo thứ tự displayOrder) — populated bởi service sau query */
    private List<String> imageUrls;

    /** Tình trạng đồ: NEW, USED_GOOD, USED_LIKE_NEW, USED_FAIR */
    private String itemCondition;

    /** Mục đích: SALE hoặc GIVEAWAY */
    private String purpose;

    /** true nếu là tin cho tặng */
    private Boolean isGiveaway;

    /** Thời điểm đăng bài — dùng để hiển thị thời gian tương đối trên feed */
    private Instant createdAt;

    // Thông tin người bán để hiển thị trên feed
    private Long sellerId;
    private String sellerName;
    private String sellerAvatarUrl;

    /**
     * True if the current viewer follows the seller (false when anonymous or self).
     */
    private Boolean isFollowed;

    /** True if the current viewer saved this listing (false when anonymous). */
    private Boolean isSaved;

    private Long likeCount;

    /** True if the current viewer liked this listing (false when anonymous). */
    private Boolean isLiked;

    private Long commentCount;

    /**
     * Constructor dùng cho JPQL Constructor Projection (SELECT new ...).
     * imageUrls KHÔNG được truyền qua JPQL (collections không supported) —
     * sẽ được populate bởi service sau query qua setImageUrls().
     * Thứ tự tham số phải khớp CHÍNH XÁC với câu lệnh SELECT trong ListingRepository.
     */
    public ListingCardResponse(Long id, String title, BigDecimal price, String location,
                               String status, String thumbnailUrl,
                               String itemCondition, String purpose, Boolean isGiveaway, Instant createdAt,
                               Long sellerId, String sellerName, String sellerAvatarUrl,
                               Boolean isFollowed, Boolean isSaved, Long likeCount, Boolean isLiked,
                               Long commentCount) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.location = location;
        this.status = status;
        this.thumbnailUrl = thumbnailUrl;
        this.itemCondition = itemCondition;
        this.purpose = purpose;
        this.isGiveaway = isGiveaway;
        this.createdAt = createdAt;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.sellerAvatarUrl = sellerAvatarUrl;
        this.isFollowed = isFollowed;
        this.isSaved = isSaved;
        this.likeCount = likeCount;
        this.isLiked = isLiked;
        this.commentCount = commentCount;
        this.imageUrls = null; // Set by service via setImageUrls()
    }
}
