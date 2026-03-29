package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * PUT /api/admin/configurations/{id} — cập nhật một bản ghi theo {@code config_id}.
 * {@code description}: bỏ qua (null) = giữ mô tả cũ; gửi "" để xóa.
 */
public record ConfigSingleUpdateRequest(
        @NotBlank(message = "value is required")
        String value,
        @Size(max = 4000, message = "description must not exceed 4000 characters")
        String description) {
}
