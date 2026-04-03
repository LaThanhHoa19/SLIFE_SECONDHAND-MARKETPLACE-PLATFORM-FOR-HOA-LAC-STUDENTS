package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSessionPageResponse {
    private List<ChatSessionResponse> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;
}
