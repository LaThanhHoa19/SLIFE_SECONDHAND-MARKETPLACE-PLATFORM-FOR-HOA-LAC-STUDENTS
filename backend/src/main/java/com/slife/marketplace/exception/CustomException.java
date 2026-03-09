/**
 * Mục đích: Business exception
 * Endpoints liên quan: handler
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.exception;

/**
 * Backwards-compatible alias around {@link SlifeException}.
 * Prefer throwing {@link SlifeException} directly in new code.
 */
public class CustomException extends SlifeException {

    public CustomException(String message) {
        super(ErrorCode.INTERNAL_ERROR, message);
    }
}
