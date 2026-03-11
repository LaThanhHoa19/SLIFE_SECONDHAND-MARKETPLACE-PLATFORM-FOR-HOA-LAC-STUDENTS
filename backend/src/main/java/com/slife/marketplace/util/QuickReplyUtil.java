package com.slife.marketplace.util;

import java.util.List;

/**
 * Quick Reply: common phrases for chat (e.g. "Is this available?").
 * Section 5 / Implementation guidance.
 */
public final class QuickReplyUtil {

    public static final List<String> DEFAULT_PHRASES = List.of(
        "Sản phẩm còn không ạ?",
        "Giá còn thương lượng được không?",
        "Mình có thể xem hàng trực tiếp không?",
        "Bạn ở khu vực nào?",
        "Mình lấy nhé, giữ giúp mình."
    );

    public static List<String> getQuickReplies() {
        return DEFAULT_PHRASES;
    }

    private QuickReplyUtil() {}
}
