-- Gán mật khẩu mặc định cho tài khoản admin seed (V1__newdb.sql).
-- Mật khẩu: Admin123!  (BCrypt strength 10; chỉ dùng dev/local, đổi trên môi trường thật)
UPDATE users
SET password_hash = '$2b$10$6Q2NcrgxvXMbUXOoRln/x.PMBTCZ1Tf.E.ID8Zqj8eWx0DCf2XqvG'
WHERE email = 'admin@fpt.edu.vn';
