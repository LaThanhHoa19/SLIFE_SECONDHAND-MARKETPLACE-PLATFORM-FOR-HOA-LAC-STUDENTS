package com.slife.marketplace.dto.response;

import lombok.Data;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Long parentId;
    /** true = danh mục cố định của hệ thống, không sửa/xóa qua admin */
    private boolean systemLocked;
}
