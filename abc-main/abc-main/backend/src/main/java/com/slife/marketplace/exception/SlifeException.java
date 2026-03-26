package com.slife.marketplace.exception;

/**
 * Domain-specific exception that always carries an {@link ErrorCode}.
 * This should be thrown from service layer instead of generic RuntimeException.
 */
public class SlifeException extends RuntimeException {

    private final ErrorCode errorCode;
    private final transient Object details;

    public SlifeException(ErrorCode errorCode) {
        this(errorCode, null, null);
    }

    public SlifeException(ErrorCode errorCode, String message) {
        this(errorCode, message, null);
    }

    public SlifeException(ErrorCode errorCode, Object details) {
        this(errorCode, null, details);
    }

    public SlifeException(ErrorCode errorCode, String message, Object details) {
        super(message != null ? message : errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = details;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Object getDetails() {
        return details;
    }
}

