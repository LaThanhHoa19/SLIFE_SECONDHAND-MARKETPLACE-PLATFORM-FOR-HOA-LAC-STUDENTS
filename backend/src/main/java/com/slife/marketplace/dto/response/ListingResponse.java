package com.slife.marketplace.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ListingResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String condition;
    private String itemCondition;
    private String purpose;
    private String location;
    /** Trạng thái listing hiện tại (ACTIVE, HIDDEN, MOD_HIDDEN, SOLD, ...). */
    private String status;
    /** Alias tương thích FE cũ. */
    private String itemStatus;
    private java.time.Instant createdAt;
    /** URL thuần (giữ tương thích client cũ). */
    private java.util.List<String> images;
    /** id + url — dùng khi sửa tin để xóa từng ảnh. */
    private java.util.List<ListingImageItemResponse> imageItems;
    private Object sellerSummary;
    private Boolean isSaved;
    private Boolean isFollowed;
    private Long likeCount;
    private Boolean isLiked;
    private Boolean isGiveaway;
    /** Object chứa lat, lng, locationName, addressText của điểm hẹn (nếu có) */
    private Object pickupAddress;
    private Object category;
    private Object seller;
    @JsonProperty("sellerPhone")
    private String sellerPhone;
    @JsonProperty("phoneVerified")
    private Boolean phoneVerified;
}
