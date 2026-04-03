package com.slife.marketplace.dto.request;

import com.slife.marketplace.entity.MessageType;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class SendMessageRequest {

    /**
     * Existing chat session. Omit when sending the first message via {@link #listingId}
     * (session is created on send).
     */
    private String sessionId;

    /**
     * Listing to open a chat about — used only when {@link #sessionId} is absent (first outbound message).
     */
    private Long listingId;

    @AssertTrue(message = "Either sessionId or listingId is required")
    public boolean isSessionOrListingPresent() {
        boolean hasSession = sessionId != null && !sessionId.isBlank();
        return hasSession || listingId != null;
    }

    /** Message body text — required for TEXT messages, optional for IMAGE. */
    private String content;

    /** Defaults to TEXT when omitted. */
    private MessageType messageType = MessageType.TEXT;

    /** URL returned by POST /chats/upload — required for IMAGE messages. */
    private String fileUrl;

    /** Optional: reply to a previous message in the same session. */
    private Long replyToMessageId;

    /** Optional: quote a previous message in the same session. */
    private Long quoteMessageId;
}
