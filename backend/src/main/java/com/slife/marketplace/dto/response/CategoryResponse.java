package com.slife.marketplace.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Long parentId;
    private List<CategoryResponse> children;
}
