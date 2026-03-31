package com.slife.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Ảnh tin đăng kèm id (để xóa / thay thế khi sửa tin). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListingImageItemResponse {
    private Long id;
    private String url;
}
