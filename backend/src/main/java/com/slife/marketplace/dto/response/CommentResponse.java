package com.slife.marketplace.dto.response;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class CommentResponse {

    private Long id;
    private String content;
    private Instant createdAt;

    /** Limited user info: userId, fullName, avatarUrl */
    private Map<String, Object> author;

    /** URLs cac anh trong comment */
    private List<String> images;

    private List<CommentResponse> replies;
}