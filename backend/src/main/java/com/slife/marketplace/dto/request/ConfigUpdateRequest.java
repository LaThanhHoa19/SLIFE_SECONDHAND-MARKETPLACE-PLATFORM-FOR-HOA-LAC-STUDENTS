package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * PUT /api/admin/configurations — mỗi phần tử trong mảng.
 * {@code description}: tùy chọn; bỏ qua (null) khi cập nhật = giữ mô tả cũ; gửi "" để xóa mô tả.
 */
public record ConfigUpdateRequest(
        @NotBlank(message = "key is required")
        String key,
        @NotBlank(message = "value is required")
        String value,
        @Size(max = 4000, message = "description must not exceed 4000 characters")
        String description) {
}
