package com.slife.marketplace.dto.request;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class UpdateCommentRequest {
    @Size(max = 2000)
    private String content;

    @Size(max = 5)
    private List<String> imageUrls = new ArrayList<>();
}
