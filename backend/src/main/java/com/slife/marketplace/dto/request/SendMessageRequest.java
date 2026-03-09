package com.slife.marketplace.dto.request;

import com.slife.marketplace.entity.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "sessionId required")
    private String sessionId;

    private String content;

    private MessageType messageType = MessageType.TEXT;

    private String fileUrl;
}
