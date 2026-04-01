-- Phiên bản JWT (claim tv): tăng khi ban / revoke toàn bộ session.
-- Idempotent: bỏ qua nếu cột đã tồn tại (môi trường đã tạo tay).
SET @col_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'token_revision'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN token_revision BIGINT NOT NULL DEFAULT 0 AFTER violation_count',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
