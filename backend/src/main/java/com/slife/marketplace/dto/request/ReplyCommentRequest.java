package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ReplyCommentRequest {

    /** Text noi dung, co the null neu gui anh */
    @Size(max = 2000)
    private String content;

    /** URL cac anh da upload truoc (toi da 5 anh/comment) */
    @Size(max = 5, message = "Max 5 images per comment")
    private List<String> imageUrls = new ArrayList<>();
}