package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateCommunityPostRequest {

    @NotBlank
    @Size(max = 50)
    private String title;

    @Size(max = 500)
    private String description;

    /** Chuỗi hashtag gửi kèm API (ít dùng; hashtag chính lấy từ nội dung). */
    @Size(max = 100, message = "Tối đa 100 hashtag trong payload")
    private List<@Size(max = 100) String> hashtags = new ArrayList<>();
}
