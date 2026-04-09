package com.slife.marketplace.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class CommunityPostCursorCodecTest {

    @Test
    @DisplayName("encodeLatest: null input -> null")
    void encodeLatest_null_shouldReturnNull() {
        assertNull(CommunityPostCursorCodec.encodeLatest(null, 1L));
        assertNull(CommunityPostCursorCodec.encodeLatest(Instant.now(), null));
    }

    @Test
    @DisplayName("decodeLatest: null/blank/invalid -> null")
    void decodeLatest_invalid_shouldReturnNull() {
        assertNull(CommunityPostCursorCodec.decodeLatest(null));
        assertNull(CommunityPostCursorCodec.decodeLatest("   "));
        assertNull(CommunityPostCursorCodec.decodeLatest("not-base64"));
        // base64 of "123|" (missing id)
        assertNull(CommunityPostCursorCodec.decodeLatest("MTIzfA"));
        // base64 of "|1" (missing ms)
        assertNull(CommunityPostCursorCodec.decodeLatest("fDE"));
    }

    @Test
    @DisplayName("encodeLatest/decodeLatest: roundtrip")
    void latest_roundtrip() {
        Instant t = Instant.ofEpochMilli(1700000000000L);
        String c = CommunityPostCursorCodec.encodeLatest(t, 99L);
        assertNotNull(c);
        CommunityPostCursorCodec.LatestCursor decoded = CommunityPostCursorCodec.decodeLatest(c);
        assertNotNull(decoded);
        assertEquals(t, decoded.createdAt());
        assertEquals(99L, decoded.id());
    }

    @Test
    @DisplayName("encodeTop: null input -> null")
    void encodeTop_null_shouldReturnNull() {
        assertNull(CommunityPostCursorCodec.encodeTop(1L, null, 1L));
        assertNull(CommunityPostCursorCodec.encodeTop(1L, Instant.now(), null));
    }

    @Test
    @DisplayName("decodeTop: null/blank/invalid -> null")
    void decodeTop_invalid_shouldReturnNull() {
        assertNull(CommunityPostCursorCodec.decodeTop(null));
        assertNull(CommunityPostCursorCodec.decodeTop(" "));
        assertNull(CommunityPostCursorCodec.decodeTop("not-base64"));
        // base64 of "1|2" (missing part)
        assertNull(CommunityPostCursorCodec.decodeTop("MXwy"));
        // base64 of "x|2|3" (non-numeric score)
        assertNull(CommunityPostCursorCodec.decodeTop("eHwyfDM"));
    }

    @Test
    @DisplayName("encodeTop/decodeTop: roundtrip")
    void top_roundtrip() {
        Instant t = Instant.ofEpochMilli(1700000000000L);
        String c = CommunityPostCursorCodec.encodeTop(123L, t, 88L);
        assertNotNull(c);
        CommunityPostCursorCodec.TopCursor decoded = CommunityPostCursorCodec.decodeTop(c);
        assertNotNull(decoded);
        assertEquals(123L, decoded.score());
        assertEquals(t, decoded.createdAt());
        assertEquals(88L, decoded.id());
    }
}

