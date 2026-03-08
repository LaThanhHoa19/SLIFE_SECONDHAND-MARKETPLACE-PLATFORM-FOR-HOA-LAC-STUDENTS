package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "sessionId required")
    private String sessionId;

    @NotBlank(message = "content required")
    private String content;
}
