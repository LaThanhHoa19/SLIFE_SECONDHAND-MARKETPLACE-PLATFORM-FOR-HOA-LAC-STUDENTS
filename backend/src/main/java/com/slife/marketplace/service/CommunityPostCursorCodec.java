package com.slife.marketplace.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;

/**
 * Encode/decode a stable cursor for community feed.
 * - latest: epochMillis + "|" + id
 * - top: score + "|" + epochMillis + "|" + id
 */
final class CommunityPostCursorCodec {
    private CommunityPostCursorCodec() {}

    static String encodeLatest(Instant createdAt, Long id) {
        if (createdAt == null || id == null) return null;
        String raw = createdAt.toEpochMilli() + "|" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static LatestCursor decodeLatest(String cursor) {
        if (cursor == null || cursor.isBlank()) return null;
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor.trim()), StandardCharsets.UTF_8);
            int idx = raw.lastIndexOf('|');
            if (idx <= 0 || idx >= raw.length() - 1) return null;
            long ms = Long.parseLong(raw.substring(0, idx));
            long id = Long.parseLong(raw.substring(idx + 1));
            return new LatestCursor(Instant.ofEpochMilli(ms), id);
        } catch (Exception ignored) {
            return null;
        }
    }

    static String encodeTop(long score, Instant createdAt, Long id) {
        if (createdAt == null || id == null) return null;
        String raw = score + "|" + createdAt.toEpochMilli() + "|" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static TopCursor decodeTop(String cursor) {
        if (cursor == null || cursor.isBlank()) return null;
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor.trim()), StandardCharsets.UTF_8);
            String[] parts = raw.split("\\|");
            if (parts.length != 3) return null;
            long score = Long.parseLong(parts[0]);
            long ms = Long.parseLong(parts[1]);
            long id = Long.parseLong(parts[2]);
            return new TopCursor(score, Instant.ofEpochMilli(ms), id);
        } catch (Exception ignored) {
            return null;
        }
    }

    record LatestCursor(Instant createdAt, long id) {
        LatestCursor {
            Objects.requireNonNull(createdAt, "createdAt");
        }
    }

    record TopCursor(long score, Instant createdAt, long id) {
        TopCursor {
            Objects.requireNonNull(createdAt, "createdAt");
        }
    }
}

