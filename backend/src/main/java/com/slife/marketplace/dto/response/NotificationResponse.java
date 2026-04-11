package com.slife.marketplace.dto.response;

import com.slife.marketplace.entity.Notification;
import lombok.Data;

import java.time.Instant;

@Data
public class NotificationResponse {

    private Long id;
    private String type;
    private String refType;
    private Long refId;
    private String refCode; // Hashed refId for secure URLs
    private String content;
    private Boolean isRead;
    private Instant createdAt;
    /** Deep-link to chat session (UUID string). */
    private String sessionId;
    /** Optional: deep-link to a specific message id in the session. */
    private Long messageId;

    public static NotificationResponse from(Notification n) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setType(n.getType());
        dto.setRefType(n.getRefType());
        dto.setRefId(n.getRefId());
        
        // Tự động gán code bảo mật cho các refType cần hash URL
        if (n.getRefId() != null) {
            String rt = n.getRefType();
            if ("LISTING".equals(rt) || "SELLER_PROFILE".equals(rt) || "OFFER_CHAT".equals(rt)) {
                dto.setRefCode(com.slife.marketplace.util.IdHasher.encode(n.getRefId()));
            }
        }
        
        dto.setContent(n.getContent());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
