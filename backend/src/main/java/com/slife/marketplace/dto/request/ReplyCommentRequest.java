package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReplyCommentRequest {

    @NotBlank
    private String content;
}

