package com.slife.marketplace.dto.response;

import com.slife.marketplace.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReferenceResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private MessageType messageType;
    private String fileUrl;
}
