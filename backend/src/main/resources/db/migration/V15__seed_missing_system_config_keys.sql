-- Seed các khóa cấu hình hệ thống còn thiếu.
-- Idempotent: chỉ thêm khi config_name chưa tồn tại.

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'MAX_IMAGES', '10', 'Giới hạn ảnh toàn hệ thống (trần trên cho mỗi tin).', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'MAX_IMAGES'
);

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'MAX_IMAGES_PER_POST', '10', 'Số ảnh tối đa cho mỗi tin đăng.', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'MAX_IMAGES_PER_POST'
);

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'LISTING_EXPIRATION', '30', 'Số ngày hết hạn của tin đăng ACTIVE.', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'LISTING_EXPIRATION'
);

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'REPORT_THRESHOLD', '3', 'Ngưỡng báo cáo để xử lý vi phạm.', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'REPORT_THRESHOLD'
);

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'AUTO_HIDE_REPORT_THRESHOLD', '3', 'Ngưỡng tự động ẩn khi số báo cáo chờ xử lý đạt mức này.', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'AUTO_HIDE_REPORT_THRESHOLD'
);

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'DEAL_TIMEOUT_DAYS', '3', 'Số ngày timeout để tự động hoàn tất giao dịch.', NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM configurations WHERE config_name = 'DEAL_TIMEOUT_DAYS'
);
