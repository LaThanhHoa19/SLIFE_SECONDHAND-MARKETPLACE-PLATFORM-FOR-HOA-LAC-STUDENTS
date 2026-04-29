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
public class ChatSessionResponse {

    private String sessionId;  // UUID
    private Long listingId;
    private String listingCode; // Hashed listingId
    private String listingTitle;
    private Long buyerId;
    private Long sellerId;
    private String otherParticipantName;
    /** Avatar URL của đối phương (path tương đối hoặc URL đầy đủ). */
    private String otherParticipantAvatarUrl;
    private String status;
    private Instant lastMessageAt;
    private String lastMessagePreview;
    private Long unreadCount;
}
