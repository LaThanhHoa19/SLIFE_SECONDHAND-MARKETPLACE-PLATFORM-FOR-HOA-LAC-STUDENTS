-- Sửa tên/mô tả danh mục (Flyway V10) khi RDS đã lưu sai encoding.
-- Chạy (trên máy có file này):
--   mysql -h <RDS_HOST> -u admin -p --default-character-set=utf8mb4 slife_db < repair-categories-utf8-rds.sql
-- Hoặc trong mysql: SOURCE /path/to/repair-categories-utf8-rds.sql;
--
-- category_id 1–3: seed V1 (không dấu) — giữ nguyên.
-- category_id 4–15: bản chuẩn UTF-8 (khớp backup-rebuilt.sql / V10).

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

UPDATE categories SET
  name = 'Sách & tài liệu',
  description = 'Sách, giáo trình, tạp chí và tài liệu học tập'
WHERE category_id = 4;

UPDATE categories SET
  name = 'Điện tử & công nghệ',
  description = 'Laptop, điện thoại, phụ kiện và thiết bị số'
WHERE category_id = 5;

UPDATE categories SET
  name = 'Ký túc xá & đời sống',
  description = 'Đồ dùng sinh hoạt, nội thất mini cho KTX'
WHERE category_id = 6;

UPDATE categories SET
  name = 'Sách luyện thi & ôn tập',
  description = 'Luyện IELTS, TOEIC, ôn thi các môn'
WHERE category_id = 7;

UPDATE categories SET
  name = 'Vở, giấy & dụng cụ viết',
  description = 'Vở, giấy nháp, bút, highlight'
WHERE category_id = 8;

UPDATE categories SET
  name = 'Laptop & máy tính bảng',
  description = 'Laptop, tablet, phụ kiện đi kèm'
WHERE category_id = 9;

UPDATE categories SET
  name = 'Phụ kiện máy tính',
  description = 'Chuột, bàn phím, hub, túi chống sốc'
WHERE category_id = 10;

UPDATE categories SET
  name = 'Âm thanh & tai nghe',
  description = 'Tai nghe, loa, mic'
WHERE category_id = 11;

UPDATE categories SET
  name = 'Điện thoại & smartwatch',
  description = 'Điện thoại, đồng hồ thông minh, ốp lưng'
WHERE category_id = 12;

UPDATE categories SET
  name = 'Thiết bị gia dụng nhỏ',
  description = 'Ấm siêu tốc, máy sấy tóc, ổ cắm'
WHERE category_id = 13;

UPDATE categories SET
  name = 'Đèn & quạt',
  description = 'Đèn bàn, đèn ngủ, quạt mini'
WHERE category_id = 14;

UPDATE categories SET
  name = 'Nội thất & sắp xếp',
  description = 'Kệ, móc treo, hộp đựng, gối'
WHERE category_id = 15;
