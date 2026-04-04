package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateCommunityPostRequest {

    @NotBlank
    @Size(max = 300)
    private String title;

    @Size(max = 8000)
    private String description;

    /** Chuỗi hashtag đã chuẩn hóa phía client hoặc thô — service sẽ normalize. */
    @Size(max = 20, message = "Tối đa 20 hashtag")
    private List<@Size(max = 100) String> hashtags = new ArrayList<>();
}
