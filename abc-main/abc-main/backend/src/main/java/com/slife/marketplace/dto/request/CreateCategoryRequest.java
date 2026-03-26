/**
 * Mục đích: DTO request CreateCategoryRequest
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must not exceed 200 characters")
    private String name;

    // Nullable in DB, but keep some basic bounds for API sanity
    @Size(max = 2000, message = "description must not exceed 2000 characters")
    private String description;

    // Null = root category
    private Long parentId;
}