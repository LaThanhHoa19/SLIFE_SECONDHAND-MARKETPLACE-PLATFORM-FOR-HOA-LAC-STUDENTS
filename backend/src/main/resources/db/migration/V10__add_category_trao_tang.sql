-- Danh mục "Trao tặng" cho bài đăng cho tặng / miễn phí (bổ sung so với seed V1)
-- name UNIQUE: INSERT IGNORE bỏ qua nếu đã tồn tại (an toàn khi chạy lại thủ công)
INSERT IGNORE INTO categories (name, description) VALUES
('Trao tặng', 'Hàng cho tặng, miễn phí — phù hợp khi người bán chọn trao tặng');
