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
    private String listingTitle;
    private Long buyerId;
    private Long sellerId;
    private String otherParticipantName;
    private String status;
    private Instant lastMessageAt;
    private String lastMessagePreview;
}
