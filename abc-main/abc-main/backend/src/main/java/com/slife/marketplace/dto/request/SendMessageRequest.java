package com.slife.marketplace.dto.request;

import com.slife.marketplace.entity.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "sessionId required")
    private String sessionId;

    /** Message body text — required for TEXT messages, optional for IMAGE. */
    private String content;

    /** Defaults to TEXT when omitted. */
    private MessageType messageType = MessageType.TEXT;

    /** URL returned by POST /chats/upload — required for IMAGE messages. */
    private String fileUrl;
}
