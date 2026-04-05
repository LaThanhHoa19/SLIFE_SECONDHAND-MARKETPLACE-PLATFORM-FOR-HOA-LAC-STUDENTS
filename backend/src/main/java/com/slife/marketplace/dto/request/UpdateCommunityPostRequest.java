package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateCommunityPostRequest {

    @Size(max = 50)
    private String title;

    @Size(max = 500)
    private String description;

    @Size(max = 100)
    private List<@Size(max = 100) String> hashtags;
}
