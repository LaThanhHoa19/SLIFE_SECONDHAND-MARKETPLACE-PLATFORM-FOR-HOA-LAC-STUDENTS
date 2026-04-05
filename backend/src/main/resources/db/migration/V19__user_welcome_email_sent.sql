-- Lần đầu đăng nhập Google: đã gửi email chào mừng (tránh gửi trùng).
ALTER TABLE users
    ADD COLUMN welcome_email_sent_at DATETIME(6) NULL AFTER updated_at;
