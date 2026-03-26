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
    private String content;
    private Boolean isRead;
    private Instant createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setType(n.getType());
        dto.setRefType(n.getRefType());
        dto.setRefId(n.getRefId());
        dto.setContent(n.getContent());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
