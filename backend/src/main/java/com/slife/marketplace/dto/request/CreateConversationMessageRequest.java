package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateConversationMessageRequest {
    @NotBlank(message = "content required")
    private String content;
}
