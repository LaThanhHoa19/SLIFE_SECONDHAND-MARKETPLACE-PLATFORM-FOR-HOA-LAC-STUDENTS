-- Cấu hình bổ sung: giới hạn tin, nhắc nhận hàng, mail sắp hết hạn tin.

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'PICKUP_REMINDER_HOURS', '3',
       'Số giờ trước giờ nhận hàng (deal) để gửi email nhắc hai bên. Cron quét mỗi 5 phút, cửa sổ ±7 phút.',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'PICKUP_REMINDER_HOURS');

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'MAX_ACTIVE_LISTINGS_PER_USER', '0',
       'Số tin ACTIVE tối đa mỗi người (0 = không giới hạn).',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'MAX_ACTIVE_LISTINGS_PER_USER');

INSERT INTO configurations (config_name, config_value, description, updated_by, updated_at, deleted_at)
SELECT 'LISTING_EXPIRING_SOON_HOURS_BEFORE', '24',
       'Gửi mail "tin sắp hết hạn" khi thời điểm hết hạn nằm trong khoảng [bây giờ + (N−1)h, bây giờ + N giờ] (cửa sổ 1 giờ, N giờ trước khi hết hạn).',
       NULL, CURRENT_TIMESTAMP, NULL
WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE config_name = 'LISTING_EXPIRING_SOON_HOURS_BEFORE');
