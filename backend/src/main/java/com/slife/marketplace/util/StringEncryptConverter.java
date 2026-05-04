package com.slife.marketplace.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * JPA AttributeConverter mã hóa AES-256-GCM cho cột String.
 * <p>
 * Dữ liệu lưu trong DB: Base64( IV(12) + ciphertext + tag(16) ).
 * Khi đọc: giải mã → plaintext gốc.
 * <p>
 * Key lấy từ property {@code app.chat.encryption-key} (Base64-encoded 32 bytes).
 * Nếu key rỗng/không set → fallback: lưu plaintext (tương thích ngược).
 */
@Component
@Converter
public class StringEncryptConverter implements AttributeConverter<String, String> {

    private static final Logger log = LoggerFactory.getLogger(StringEncryptConverter.class);
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Prefix để phân biệt ciphertext vs plaintext cũ chưa mã hóa. */
    private static final String ENC_PREFIX = "ENC:";

    private final SecretKey secretKey;
    private final boolean enabled;

    public StringEncryptConverter(
            @Value("${app.chat.encryption-key:}") String base64Key) {
        if (base64Key != null && !base64Key.isBlank()) {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key.trim());
            if (keyBytes.length != 32) {
                throw new IllegalArgumentException(
                        "app.chat.encryption-key must be 32 bytes (AES-256). Got " + keyBytes.length);
            }
            this.secretKey = new SecretKeySpec(keyBytes, "AES");
            this.enabled = true;
            log.info("Chat message encryption ENABLED (AES-256-GCM)");
        } else {
            this.secretKey = null;
            this.enabled = false;
            log.warn("Chat message encryption DISABLED — app.chat.encryption-key not configured");
        }
    }

    /* ---- encrypt on write ---- */

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null || !enabled) return plaintext;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] combined = ByteBuffer.allocate(iv.length + ciphertext.length)
                    .put(iv).put(ciphertext).array();

            return ENC_PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            log.error("Failed to encrypt message content", e);
            // Fallback: lưu plaintext để không mất tin nhắn
            return plaintext;
        }
    }

    /* ---- decrypt on read ---- */

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        // Tin nhắn cũ chưa mã hóa → trả về nguyên
        if (!dbData.startsWith(ENC_PREFIX)) return dbData;
        if (!enabled) {
            log.warn("Encrypted message found but encryption key not configured — returning raw");
            return dbData;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(dbData.substring(ENC_PREFIX.length()));
            ByteBuffer buf = ByteBuffer.wrap(combined);

            byte[] iv = new byte[GCM_IV_LENGTH];
            buf.get(iv);
            byte[] ciphertext = new byte[buf.remaining()];
            buf.get(ciphertext);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plainBytes = cipher.doFinal(ciphertext);

            return new String(plainBytes, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt message content", e);
            return dbData; // trả raw nếu lỗi
        }
    }
}
