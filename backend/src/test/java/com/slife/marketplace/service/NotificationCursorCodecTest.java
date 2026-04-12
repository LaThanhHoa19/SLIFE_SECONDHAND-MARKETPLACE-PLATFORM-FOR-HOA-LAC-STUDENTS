package com.slife.marketplace.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho {@link NotificationCursorCodec} (thuần logic).
 *
 * Mục tiêu:
 * - Cursor encode/decode ổn định để phân trang notification.
 * - Với input lỗi/không hợp lệ, decode phải trả null (không throw) để API an toàn.
 */
class NotificationCursorCodecTest {

    @Test
    @DisplayName("encode: null createdAt/id → null")
    void encode_null_shouldReturnNull() {
        assertNull(NotificationCursorCodec.encode(null, 1L));
        assertNull(NotificationCursorCodec.encode(Instant.now(), null));
    }

    @Test
    @DisplayName("decode: null/blank/invalid → null")
    void decode_invalid_shouldReturnNull() {
        assertNull(NotificationCursorCodec.decode(null));
        assertNull(NotificationCursorCodec.decode("   "));
        assertNull(NotificationCursorCodec.decode("not-base64"));
        // base64 of "123|" (missing id)
        assertNull(NotificationCursorCodec.decode("MTIzfA"));
        // base64 of "|1" (missing ms)
        assertNull(NotificationCursorCodec.decode("fDE"));
    }

    @Test
    @DisplayName("encode/decode: roundtrip")
    void roundtrip() {
        Instant t = Instant.ofEpochMilli(1700000000000L);
        String c = NotificationCursorCodec.encode(t, 99L);
        assertNotNull(c);
        NotificationCursorCodec.Cursor decoded = NotificationCursorCodec.decode(c);
        assertNotNull(decoded);
        assertEquals(t, decoded.createdAt());
        assertEquals(99L, decoded.id());
    }
}

