package com.slife.marketplace.dto.response;

import lombok.Data;

@Data
public class ConversationMessageResponse {
    private String senderName;
    private String content;
    private String formattedTime;
}
