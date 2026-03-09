-- Thêm cột ảnh bìa cho users
ALTER TABLE users ADD COLUMN cover_image_url VARCHAR(1000) NULL AFTER avatar_url;
