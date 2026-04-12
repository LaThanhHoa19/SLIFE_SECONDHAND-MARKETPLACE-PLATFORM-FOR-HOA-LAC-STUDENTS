package com.slife.marketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code app.storage.mode=local} — ghi đĩa như cũ (APP_UPLOAD_DIR).<br>
 * {@code app.storage.mode=s3} — upload lên S3; URL lưu DB là HTTPS công khai (cần bucket policy / OAI tuỳ bạn).
 */
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /** {@code local} (mặc định) hoặc {@code s3}. */
    private String mode = "local";

    private final S3 s3 = new S3();

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public S3 getS3() {
        return s3;
    }

    public static class S3 {
        private String bucket = "";
        private String region = "ap-southeast-1";
        /** Tiền tố object key, ví dụ {@code media} → key {@code media/listings/...}. */
        private String keyPrefix = "media";
        /**
         * Tuỳ chọn: URL gốc để ghép (không dấu / cuối), ví dụ CDN hoặc website endpoint.
         * Để trống → dùng dạng virtual-hosted {@code https://bucket.s3.region.amazonaws.com/key}.
         */
        private String publicBaseUrl = "";

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public String getKeyPrefix() {
            return keyPrefix;
        }

        public void setKeyPrefix(String keyPrefix) {
            this.keyPrefix = keyPrefix;
        }

        public String getPublicBaseUrl() {
            return publicBaseUrl;
        }

        public void setPublicBaseUrl(String publicBaseUrl) {
            this.publicBaseUrl = publicBaseUrl;
        }
    }
}
