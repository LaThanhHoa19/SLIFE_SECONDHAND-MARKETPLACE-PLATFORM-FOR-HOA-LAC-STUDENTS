package com.slife.marketplace.util;

import java.nio.ByteBuffer;
import java.util.Base64;

/**
 * Utility to obfuscate numeric IDs into strings and back.
 * Used for secure URLs as requested by USER (Hash URL).
 */
public class IdHasher {
    // Secret salt to ensure hash is unpredictable to casual users
    private static final long SALT = 0xABC123DEF4567890L;

    /**
     * Encodes a Long ID into an obfuscated Base64 string.
     */
    public static String encode(Long id) {
        if (id == null) return null;
        // XOR with SALT and reverse bytes for extra obfuscation
        long obfuscated = id ^ SALT;
        byte[] bytes = ByteBuffer.allocate(Long.BYTES).putLong(obfuscated).array();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Decodes an obfuscated string back into a Long ID.
     */
    public static Long decode(String hash) {
        if (hash == null || hash.trim().isEmpty()) return null;
        try {
            // Support both standard and URL-safe Base64 as fallback
            byte[] bytes;
            try {
                bytes = Base64.getUrlDecoder().decode(hash);
            } catch (IllegalArgumentException e) {
                bytes = Base64.getDecoder().decode(hash);
            }
            
            if (bytes.length < Long.BYTES) return null;
            long obfuscated = ByteBuffer.wrap(bytes).getLong();
            return obfuscated ^ SALT;
        } catch (Exception e) {
            return null;
        }
    }
}
