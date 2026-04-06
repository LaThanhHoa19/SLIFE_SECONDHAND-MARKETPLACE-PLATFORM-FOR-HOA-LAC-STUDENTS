package com.slife.marketplace.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;

/**
 * Encode/decode a stable cursor for notifications.
 * Format before base64: epochMillis + "|" + id
 */
final class NotificationCursorCodec {
    private NotificationCursorCodec() {}

    static String encode(Instant createdAt, Long id) {
        if (createdAt == null || id == null) return null;
        String raw = createdAt.toEpochMilli() + "|" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static Cursor decode(String cursor) {
        if (cursor == null || cursor.isBlank()) return null;
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor.trim()), StandardCharsets.UTF_8);
            int idx = raw.lastIndexOf('|');
            if (idx <= 0 || idx >= raw.length() - 1) return null;
            long ms = Long.parseLong(raw.substring(0, idx));
            long id = Long.parseLong(raw.substring(idx + 1));
            return new Cursor(Instant.ofEpochMilli(ms), id);
        } catch (Exception ignored) {
            return null;
        }
    }

    record Cursor(Instant createdAt, long id) {
        Cursor {
            Objects.requireNonNull(createdAt, "createdAt");
        }
    }
}

