-- Cây danh mục cha–con (bổ sung sau V1).
-- Cha trước: INSERT cha → gán parent_id cho 3 dòng mẫu V1 theo name → thêm các danh mục con mới.
ALTER TABLE categories ADD COLUMN system_locked TINYINT(1) DEFAULT 0;
-- 1) Danh mục gốc (cấp 1)
INSERT INTO categories (name, description, parent_id, system_locked) VALUES
    ('Sách & tài liệu', 'Sách, giáo trình, tạp chí và tài liệu học tập', NULL, 0);
SET @cat_sach := LAST_INSERT_ID();

INSERT INTO categories (name, description, parent_id, system_locked) VALUES
    ('Điện tử & công nghệ', 'Laptop, điện thoại, phụ kiện và thiết bị số', NULL, 0);
SET @cat_dientu := LAST_INSERT_ID();

INSERT INTO categories (name, description, parent_id, system_locked) VALUES
    ('Ký túc xá & đời sống', 'Đồ dùng sinh hoạt, nội thất mini cho KTX', NULL, 0);
SET @cat_ktx := LAST_INSERT_ID();

-- 2) Gắn các danh mục phẳng từ V1 làm con của các nhánh trên (theo đúng tên seed V1)
UPDATE categories SET parent_id = @cat_sach WHERE name = 'Giao trinh & Tai lieu' AND parent_id IS NULL;
UPDATE categories SET parent_id = @cat_dientu WHERE name = 'Do dien tu' AND parent_id IS NULL;
UPDATE categories SET parent_id = @cat_ktx WHERE name = 'Do dung KTX' AND parent_id IS NULL;

-- 3) Danh mục con bổ sung (cấp 2)
INSERT INTO categories (name, description, parent_id, system_locked) VALUES
                                                                         ('Sách luyện thi & ôn tập', 'Luyện IELTS, TOEIC, ôn thi các môn', @cat_sach, 0),
                                                                         ('Vở, giấy & dụng cụ viết', 'Vở, giấy nháp, bút, highlight', @cat_sach, 0),
                                                                         ('Laptop & máy tính bảng', 'Laptop, tablet, phụ kiện đi kèm', @cat_dientu, 0),
                                                                         ('Phụ kiện máy tính', 'Chuột, bàn phím, hub, túi chống sốc', @cat_dientu, 0),
                                                                         ('Âm thanh & tai nghe', 'Tai nghe, loa, mic', @cat_dientu, 0),
                                                                         ('Điện thoại & smartwatch', 'Điện thoại, đồng hồ thông minh, ốp lưng', @cat_dientu, 0),
                                                                         ('Thiết bị gia dụng nhỏ', 'Ấm siêu tốc, máy sấy tóc, ổ cắm', @cat_ktx, 0),
                                                                         ('Đèn & quạt', 'Đèn bàn, đèn ngủ, quạt mini', @cat_ktx, 0),
                                                                         ('Nội thất & sắp xếp', 'Kệ, móc treo, hộp đựng, gối', @cat_ktx, 0);
