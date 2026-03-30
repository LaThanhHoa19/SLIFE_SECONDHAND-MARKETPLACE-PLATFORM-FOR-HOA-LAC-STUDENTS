package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Số tin ACTIVE theo từng danh mục — dùng cho landing & thống kê công khai.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStatDto {
    private Long categoryId;
    private String name;
    private Long listingCount;
}
