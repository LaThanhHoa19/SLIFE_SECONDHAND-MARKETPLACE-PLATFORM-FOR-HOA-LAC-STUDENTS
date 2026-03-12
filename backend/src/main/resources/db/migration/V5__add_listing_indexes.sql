-- SCRUM-46: Database indexing for listings search performance
-- Mục tiêu: tối ưu /api/search khi dữ liệu > 100 records.

-- 1. Index cho status để tăng tốc filter trạng thái listing.
-- Lưu ý: đã có idx_listings_status_created(status, created_at) từ V1,
-- nhưng thêm index đơn cột giúp tối ưu thêm các query chỉ lọc theo status.
CREATE INDEX idx_listings_status_only
  ON listings (status);

-- 2. Functional index cho LOWER(title) để hỗ trợ LIKE dạng không phân biệt hoa thường.
-- Dùng MySQL 8+ expression index.
CREATE INDEX idx_listings_title_lower
  ON listings ((LOWER(title)));

-- 3. Index cho khóa ngoại category_id để tối ưu JOIN (phòng khi schema cũ chưa có).
-- (Nếu đã tồn tại idx_listings_category thì MySQL sẽ báo lỗi khi migrate trên schema cũ;
-- trong môi trường mới, migration sequence sẽ tạo từ đầu theo V1+).
-- Có thể bỏ qua nếu trùng tên; giữ lại cho đủ spec SCRUM.
-- CREATE INDEX idx_listings_category
--   ON listings (category_id);

-- 4. Index cho pickup_address_id để tối ưu JOIN tới addresses.
CREATE INDEX idx_listings_pickup_address
  ON listings (pickup_address_id);

