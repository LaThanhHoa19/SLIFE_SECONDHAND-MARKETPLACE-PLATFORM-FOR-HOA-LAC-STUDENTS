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

    /** BR-35: Max offer proposals per buyer per listing. */
    public static final int MAX_OFFERS_PER_LISTING = 5;

    /** Max chat image size in bytes (5 MB). */
    public static final long MAX_CHAT_IMAGE_BYTES = 5L * 1024 * 1024;

    /** Folder name (under uploadBasePath) for chat images. */
    public static final String CHAT_UPLOAD_DIR = "chats";

    /** System message sent after deal confirmation. */
    public static final String DEAL_CONFIRMED_MSG = "✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.";

    private Constants() {}
}