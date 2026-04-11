-- V25: Thêm đơn vị cấu hình cho Deal Timeout và Review Window.
-- Admin có thể đổi từ DAYS sang MINUTES để test nhanh mà không cần restart Docker.

-- DEAL_TIMEOUT_UNIT: đơn vị cho DEAL_TIMEOUT_DAYS (DAYS | MINUTES)
INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'DEAL_TIMEOUT_UNIT', 'DAYS',
       'Đơn vị thời gian cho DEAL_TIMEOUT_DAYS: DAYS hoặc MINUTES. Ví dụ: đặt DEAL_TIMEOUT_DAYS=5 + DEAL_TIMEOUT_UNIT=MINUTES để tự động chuyển sau 5 phút (dùng để test).',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'DEAL_TIMEOUT_UNIT');

-- REVIEW_TIMEOUT_VALUE: số ngày/phút buyer có thể gửi đánh giá sau khi deal SUCCESS
INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'REVIEW_TIMEOUT_VALUE', '7',
       'Thời gian tối đa buyer được phép gửi đánh giá kể từ khi deal hoàn tất (SUCCESS). Kết hợp với REVIEW_TIMEOUT_UNIT.',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'REVIEW_TIMEOUT_VALUE');

-- REVIEW_TIMEOUT_UNIT: đơn vị cho REVIEW_TIMEOUT_VALUE (DAYS | MINUTES)
INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'REVIEW_TIMEOUT_UNIT', 'DAYS',
       'Đơn vị thời gian cho REVIEW_TIMEOUT_VALUE: DAYS hoặc MINUTES.',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'REVIEW_TIMEOUT_UNIT');
