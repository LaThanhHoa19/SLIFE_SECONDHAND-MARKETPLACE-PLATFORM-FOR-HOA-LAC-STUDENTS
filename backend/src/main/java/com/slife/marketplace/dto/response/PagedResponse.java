/**
 * Mục đích: DTO response PagedResponse
 * Endpoints liên quan: controller
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.dto.response;
import lombok.Data;
@Data public class PagedResponse<T> { private java.util.List<T> data; private Long totalElements; private Integer totalPages; private Integer page; private Integer size; }