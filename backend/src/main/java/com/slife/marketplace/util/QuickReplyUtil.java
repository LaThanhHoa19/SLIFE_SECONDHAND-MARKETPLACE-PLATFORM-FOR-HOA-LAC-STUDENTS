package com.slife.marketplace.util;

import java.util.List;

/**
 * Quick Reply: common phrases for chat (e.g. "Is this available?").
 * Section 5 / Implementation guidance.
 */
public final class QuickReplyUtil {

    /** Gợi ý kiểu chợ / marketplace (người mua + người bán). */
    public static final List<String> DEFAULT_PHRASES = List.of(
            // Người mua
            "Cho mình hỏi sản phẩm còn không ạ?",
            "Giá có thương lượng thêm được không?",
            "Mình có thể qua xem hàng trực tiếp không?",
            "Bạn có giao hàng / ship được không?",
            "Bạn đang ở khu vực nào (KTX / tòa nào)?",
            "Mình chốt nhé, giữ giúp mình.",
            "Mình chuyển khoản trước được không?",
            "Hàng còn bảo hành / đầy đủ phụ kiện không ạ?",
            // Người bán
            "Chào bạn, mình vẫn còn hàng nhé.",
            "Bạn qua xem trực tiếp được thì báo mình giờ nhé.",
            "Giá mình để là giá tốt rồi, bạn tham khảo thêm ạ.",
            "Mình có thể ship trong khu vực trường / Hòa Lạc.",
            "Cảm ơn bạn đã quan tâm tin nhé!"
    );

    public static List<String> getQuickReplies() {
        return DEFAULT_PHRASES;
    }

    private QuickReplyUtil() {}
}
