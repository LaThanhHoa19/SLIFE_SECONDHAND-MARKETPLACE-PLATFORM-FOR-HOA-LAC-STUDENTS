package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateCommunityPostRequest {

    @Size(max = 1000)
    private String description;

    @Size(max = 2000)
    private List<@Size(max = 100) String> hashtags;
}
