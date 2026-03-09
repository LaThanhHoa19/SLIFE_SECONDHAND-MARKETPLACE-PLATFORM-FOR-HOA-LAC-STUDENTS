package com.slife.marketplace.dto.response;

import com.slife.marketplace.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    private Boolean isFromCurrentUser;

    private MessageType messageType;
    private String fileUrl;

    private Long offerId;
    private BigDecimal offerAmount;
    private String offerStatus;
}
