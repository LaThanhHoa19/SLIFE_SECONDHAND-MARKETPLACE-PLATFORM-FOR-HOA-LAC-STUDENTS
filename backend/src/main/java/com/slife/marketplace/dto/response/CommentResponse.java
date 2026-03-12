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

    /**
     * Limited user info to avoid leaking sensitive fields.
     * Example keys: userId, fullName, avatarUrl.
     */
    private Map<String, Object> author;

    private List<CommentResponse> replies;
}

