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
    /** True when sender is the current user (by id or email). */
    private Boolean isFromCurrentUser;

    /** Type of message: TEXT, IMAGE, OFFER_PROPOSAL, DEAL_CONFIRMATION */
    private MessageType messageType;

    /** URL for IMAGE messages. */
    private String fileUrl;

    /** Populated for OFFER_PROPOSAL messages. */
    private Long offerId;
    private BigDecimal offerAmount;
    private String offerStatus;
}
