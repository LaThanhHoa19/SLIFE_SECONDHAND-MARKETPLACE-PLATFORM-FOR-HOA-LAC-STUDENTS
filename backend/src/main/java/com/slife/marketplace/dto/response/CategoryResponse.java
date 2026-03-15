package com.slife.marketplace.dto.response;

import lombok.Data;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    /** ID của danh mục cha; null nếu là danh mục gốc. */
    private Long parentId;
}
