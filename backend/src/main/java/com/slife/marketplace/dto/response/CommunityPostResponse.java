package com.slife.marketplace.dto.response;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class CommunityPostResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private Long viewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private List<String> images;
    private List<ListingImageItemResponse> imageItems;
    private Map<String, Object> authorSummary;
    private List<String> hashtags;
    private Long likeCount;
    private Boolean isLiked;
    private Long commentCount;
}
