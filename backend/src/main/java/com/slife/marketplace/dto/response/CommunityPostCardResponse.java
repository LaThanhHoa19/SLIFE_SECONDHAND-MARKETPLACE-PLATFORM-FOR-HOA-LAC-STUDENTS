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
    private String title;
    /** Mô tả rút gọn trên feed (có thể null). */
    private String description;
    private String thumbUrl;
    private Instant createdAt;
    private Long authorId;
    private String authorName;
    private String authorAvatarUrl;
    private Long likeCount;
    private Long commentCount;
    private List<String> hashtags;
    /** null nếu khách chưa đăng nhập */
    private Boolean isLiked;
}
