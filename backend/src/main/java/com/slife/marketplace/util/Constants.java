package com.slife.marketplace.util;

/** Application message codes (Section 5.3). */
public final class Constants {

    /** No search results */
    public static final String MSG01 = "No search results";
    /** Profile/status update success */
    public static final String MSG10 = "Cập nhật thành công";
    /** Unauthorized access */
    public static final String MSG23 = "You do not have permission";

    /** Max 1 message per second per user (BR-38). */
    public static final long CHAT_RATE_LIMIT_SECONDS = 1;

    /** Auto-confirm: days after which deal becomes COMPLETED if no dispute (UC-56). */
    public static final int DEAL_AUTO_COMPLETE_DAYS = 3;

    private Constants() {}
}