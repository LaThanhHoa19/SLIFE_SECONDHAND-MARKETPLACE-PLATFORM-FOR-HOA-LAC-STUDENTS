-- ==========================================================
-- SEED DATA: FIX FOREIGN KEY ERROR [1452]
-- Đảm bảo các ID này đã tồn tại trong bảng cha tương ứng
-- ==========================================================

-- 1. ẢNH CHO TIN ĐĂNG (LISTING IMAGES) - Gắn với Listing ID từ 1 đến 3
INSERT INTO listing_images (listing_id, image_url, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800', 1),
(1, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800', 2),
(1, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800', 3),
(1, 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=800', 4),

(2, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800', 1),
(2, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800', 2),
(2, 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800', 3),
(2, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800', 4),

(3, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800', 1),
(3, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800', 2),
(3, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800', 3),
(3, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800', 4);

-- 2. ẢNH TRONG TIN NHẮN CHAT (MESSAGE IMAGES) 
-- Sửa lại: Gắn vào Message ID số 5 (Bản ghi cuối cùng của bảng messages)
INSERT INTO message_images (message_id, image_url) VALUES 
(5, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800'),
(5, 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=800');

-- 3. ẢNH TRONG ĐÁNH GIÁ (REVIEW IMAGES) - Gắn với Review ID 1
INSERT INTO review_images (review_id, image_url) VALUES 
(1, 'https://images.unsplash.com/photo-1627933604052-a058e0345204?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1566417713040-083f24a03761?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800');

-- 4. ẢNH TRONG BÌNH LUẬN (COMMENT IMAGES) - Gắn với Comment ID 1
INSERT INTO comment_images (comment_id, image_url) VALUES 
(1, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1454165833267-02306283731c?q=80&w=800');

-- 5. ẢNH TRONG BÁO CÁO (REPORT IMAGES) - Gắn với Report ID 1
INSERT INTO report_images (report_id, image_url) VALUES 
(1, 'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1579389083046-e3df9c2b3325?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800');