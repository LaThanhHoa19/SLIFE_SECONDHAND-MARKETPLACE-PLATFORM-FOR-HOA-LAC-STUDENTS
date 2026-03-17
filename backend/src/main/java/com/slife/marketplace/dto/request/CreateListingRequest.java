/**
 * Mục đích: DTO request CreateListingRequest
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    private String description;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    private String condition;

    private Boolean isGiveaway;

    private String purpose;

    private Long pickupAddressId;

    /**
     * Tên địa điểm hiển thị cho người dùng (ví dụ: "KTX Dom A, ĐH FPT Hòa Lạc").
     * Nếu FE không truyền pickupAddressId thì BE sẽ tạo Address mới với các field này.
     */
    private String pickupLocationName;

    /**
     * Địa chỉ chi tiết (tùy chọn), mô tả thêm cho locationName.
     */
    private String pickupAddressText;

    /**
     * Tọa độ Vietmap (lat, lng) khi user chọn gợi ý hoặc gim trên bản đồ.
     */
    private BigDecimal pickupLat;
    private BigDecimal pickupLng;

    /**
     * Chuẩn hóa dữ liệu numeric trước khi xử lý, tránh scale lạ từ FE.
     */
    public BigDecimal normalizedPrice() {
        return price != null ? price.setScale(2, RoundingMode.HALF_UP) : null;
    }
}