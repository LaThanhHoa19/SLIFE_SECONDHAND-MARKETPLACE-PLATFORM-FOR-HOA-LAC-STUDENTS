-- Đồng bộ giới hạn ảnh/tin với FE (listingLimits.MAX_IMAGES_PER_LISTING = 10).
-- Nếu DB đã có giá trị cũ (vd. 8), cập nhật lên 10.
INSERT INTO configurations (config_name, config_value, description)
VALUES ('MAX_IMAGES_PER_POST', '10', 'Maximum number of images per listing')
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description);
