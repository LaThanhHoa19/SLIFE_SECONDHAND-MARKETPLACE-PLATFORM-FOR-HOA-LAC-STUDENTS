package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostCardResponse {
    private Long id;
    /** Mô tả rút gọn trên feed (có thể null). */
    private String description;
    private String thumbUrl;
    /** Danh sách ảnh của bài viết để feed có thể kéo ngang. */
    private List<String> imageUrls;
    private Instant createdAt;
    private Long authorId;
    private String authorName;
    private String authorAvatarUrl;
    private Long likeCount;
    private Long commentCount;
    private List<String> hashtags;
    /** null nếu khách chưa đăng nhập */
    private Boolean isLiked;
    /** null nếu khách chưa đăng nhập */
    private Boolean isSaved;
}
