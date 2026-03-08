package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private String sessionId;
    private Long senderId;
    private String senderName;
    private String content;
    private Instant timestamp;
    private Boolean isRead;
    /** True when sender is the current user (by id or email). */
    private Boolean isFromCurrentUser;
}
