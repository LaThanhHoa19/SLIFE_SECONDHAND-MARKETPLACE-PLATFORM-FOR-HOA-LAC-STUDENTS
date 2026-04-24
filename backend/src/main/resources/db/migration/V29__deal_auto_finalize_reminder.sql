-- V27: Thêm cột nhắc nhở buyer trước khi hệ thống tự động hoàn tất deal.
-- + Seed config key DEAL_FINALIZE_REMINDER_DAYS (mặc định 1 = nhắc trước 1 ngày).

-- Cột đánh dấu đã gửi email nhắc buyer xác nhận trước auto-finalize
ALTER TABLE deals
    ADD COLUMN auto_finalize_reminder_sent TINYINT(1) NOT NULL DEFAULT 0
    AFTER reminder_sent;

-- Config: số ngày/phút trước deadline auto-finalize để gửi email nhắc buyer
INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'DEAL_FINALIZE_REMINDER_DAYS', '1',
       'Số ngày (hoặc phút nếu DEAL_TIMEOUT_UNIT=MINUTES) trước deadline auto-finalize để gửi email nhắc buyer xác nhận giao dịch. Ví dụ: 1 = nhắc trước 1 ngày.',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'DEAL_FINALIZE_REMINDER_DAYS');
