-- 02_seed_data.sql
-- Demo seed data for slife_db.
USE `slife_db`;

START TRANSACTION;

INSERT INTO users (email, password_hash, full_name, phone_number, role, status, reputation_score)
VALUES
  ('admin@slife.local', '$2a$10$demo_admin_hash', 'SLife Admin', '0900000000', 'ADMIN', 'ACTIVE', 5.00),
  ('alice@example.com', '$2a$10$demo_alice_hash', 'Alice Nguyen', '0911111111', 'USER', 'ACTIVE', 4.80),
  ('bob@example.com', '$2a$10$demo_bob_hash', 'Bob Tran', '0922222222', 'USER', 'ACTIVE', 4.60),
  ('charlie@example.com', '$2a$10$demo_charlie_hash', 'Charlie Le', '0933333333', 'USER', 'ACTIVE', 4.20)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone_number = VALUES(phone_number),
  role = VALUES(role),
  status = VALUES(status),
  reputation_score = VALUES(reputation_score);

INSERT INTO addresses (user_id, location_name, address_text, lat, lng, is_default)
SELECT u.user_id, 'KTX Khu A', 'KTX Khu A - Thu Duc', 10.8779012, 106.8061234, 1
FROM users u WHERE u.email = 'alice@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM addresses a WHERE a.user_id = u.user_id AND a.location_name = 'KTX Khu A'
  );

INSERT INTO addresses (user_id, location_name, address_text, lat, lng, is_default)
SELECT u.user_id, 'Canteen Alpha', 'Khu canteen truong', 10.8800111, 106.8053555, 1
FROM users u WHERE u.email = 'bob@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM addresses a WHERE a.user_id = u.user_id AND a.location_name = 'Canteen Alpha'
  );

INSERT INTO categories (name, description, parent_id)
VALUES
  ('Electronics', 'Do dien tu', NULL),
  ('Phones', 'Dien thoai di dong', NULL),
  ('Furniture', 'Noi that', NULL),
  ('Books', 'Sach va tai lieu', NULL)
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO listings (seller_id, category_id, pickup_address_id, title, description, price, item_condition, status, purpose, is_giveaway, expiration_date)
SELECT
  seller.user_id,
  cat.category_id,
  addr.address_id,
  'iPhone 12 64GB cu',
  'May ngon, pin 85%, full phu kien co ban',
  8900000,
  'USED_GOOD',
  'ACTIVE',
  'SALE',
  0,
  DATE_ADD(NOW(), INTERVAL 30 DAY)
FROM users seller
JOIN categories cat ON cat.name = 'Phones'
LEFT JOIN addresses addr ON addr.user_id = seller.user_id AND addr.is_default = 1
WHERE seller.email = 'alice@example.com'
  AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.title = 'iPhone 12 64GB cu');

INSERT INTO listings (seller_id, category_id, pickup_address_id, title, description, price, item_condition, status, purpose, is_giveaway, expiration_date)
SELECT
  seller.user_id,
  cat.category_id,
  addr.address_id,
  'Ban hoc tang mien phi',
  'Ban hoc cu, con chac chan, uu tien ban den lay som',
  0,
  'USED_FAIR',
  'ACTIVE',
  'GIVEAWAY',
  1,
  DATE_ADD(NOW(), INTERVAL 15 DAY)
FROM users seller
JOIN categories cat ON cat.name = 'Furniture'
LEFT JOIN addresses addr ON addr.user_id = seller.user_id AND addr.is_default = 1
WHERE seller.email = 'bob@example.com'
  AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.title = 'Ban hoc tang mien phi');

INSERT INTO listing_images (listing_id, image_url, display_order)
SELECT l.listing_id, 'https://picsum.photos/seed/slife-iphone/1280/720', 1
FROM listings l
WHERE l.title = 'iPhone 12 64GB cu'
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

INSERT INTO listing_images (listing_id, image_url, display_order)
SELECT l.listing_id, 'https://picsum.photos/seed/slife-desk/1280/720', 1
FROM listings l
WHERE l.title = 'Ban hoc tang mien phi'
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

INSERT INTO configurations (config_name, config_value, description)
VALUES
  ('MAX_DAILY_POSTS_DEFAULT', '3', 'So bai dang toi da mac dinh trong 1 ngay'),
  ('REPORT_THRESHOLD_TO_RESTRICT', '3', 'So report truoc khi he thong gioi han dang bai'),
  ('PICKUP_REMINDER_MINUTES', '30', 'So phut nhac lich hen lay hang')
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description);

INSERT INTO banned_keywords (keyword)
VALUES ('ma tuy'), ('sung'), ('lua dao')
ON DUPLICATE KEY UPDATE keyword = VALUES(keyword);

INSERT INTO follows (follower_id, followed_id)
SELECT a.user_id, b.user_id
FROM users a
JOIN users b ON b.email = 'bob@example.com'
WHERE a.email = 'alice@example.com'
ON DUPLICATE KEY UPDATE followed_id = VALUES(followed_id);

INSERT INTO saved_listings (user_id, listing_id)
SELECT u.user_id, l.listing_id
FROM users u
JOIN listings l ON l.title = 'Ban hoc tang mien phi'
WHERE u.email = 'alice@example.com'
ON DUPLICATE KEY UPDATE listing_id = VALUES(listing_id);

INSERT INTO conversations (user_id1, user_id2, listing_id, last_message_at)
SELECT
  u1.user_id,
  u2.user_id,
  l.listing_id,
  NOW()
FROM users u1
JOIN users u2 ON u2.email = 'bob@example.com'
JOIN listings l ON l.title = 'iPhone 12 64GB cu'
WHERE u1.email = 'alice@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.user_id1 = u1.user_id AND c.user_id2 = u2.user_id AND c.listing_id = l.listing_id
  );

INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read)
SELECT c.conversation_id, u.user_id, 'Con iPhone nay con fix gia khong ban?', DATE_SUB(NOW(), INTERVAL 20 MINUTE), 1
FROM conversations c
JOIN users u ON u.email = 'bob@example.com'
JOIN listings l ON l.listing_id = c.listing_id
WHERE l.title = 'iPhone 12 64GB cu'
  AND NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.conversation_id AND m.content = 'Con iPhone nay con fix gia khong ban?'
  );

INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read)
SELECT c.conversation_id, u.user_id, 'Co, minh de 8.7 trieu nhe.', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 0
FROM conversations c
JOIN users u ON u.email = 'alice@example.com'
JOIN listings l ON l.listing_id = c.listing_id
WHERE l.title = 'iPhone 12 64GB cu'
  AND NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.conversation_id AND m.content = 'Co, minh de 8.7 trieu nhe.'
  );

INSERT INTO offers (listing_id, buyer_id, amount, status)
SELECT l.listing_id, u.user_id, 8700000, 'PENDING'
FROM listings l
JOIN users u ON u.email = 'bob@example.com'
WHERE l.title = 'iPhone 12 64GB cu'
  AND NOT EXISTS (
    SELECT 1 FROM offers o WHERE o.listing_id = l.listing_id AND o.buyer_id = u.user_id AND o.amount = 8700000
  );

INSERT INTO deals (conversation_id, listing_id, proposed_by_id, address_id, deal_price, status, pickup_time, reminder_sent)
SELECT
  c.conversation_id,
  l.listing_id,
  bob.user_id,
  addr.address_id,
  8700000,
  'CONFIRMED',
  DATE_ADD(NOW(), INTERVAL 2 DAY),
  0
FROM conversations c
JOIN listings l ON l.listing_id = c.listing_id
JOIN users bob ON bob.email = 'bob@example.com'
LEFT JOIN addresses addr ON addr.user_id = bob.user_id AND addr.is_default = 1
WHERE l.title = 'iPhone 12 64GB cu'
  AND NOT EXISTS (
    SELECT 1 FROM deals d WHERE d.conversation_id = c.conversation_id AND d.listing_id = l.listing_id
  );

INSERT INTO reviews (conversation_id, reviewer_id, reviewee_id, rating, comment)
SELECT
  c.conversation_id,
  bob.user_id,
  alice.user_id,
  5,
  'Nguoi ban than thien, hang dung mo ta.'
FROM conversations c
JOIN users bob ON bob.email = 'bob@example.com'
JOIN users alice ON alice.email = 'alice@example.com'
JOIN listings l ON l.listing_id = c.listing_id
WHERE l.title = 'iPhone 12 64GB cu'
  AND NOT EXISTS (
    SELECT 1 FROM reviews r WHERE r.conversation_id = c.conversation_id AND r.reviewer_id = bob.user_id
  );

INSERT INTO notifications (user_id, type, ref_type, ref_id, content, is_read)
SELECT alice.user_id, 'FOLLOW', 'USER', bob.user_id, 'Bob vua theo doi ban.', 0
FROM users alice
JOIN users bob ON bob.email = 'bob@example.com'
WHERE alice.email = 'alice@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = alice.user_id AND n.type = 'FOLLOW' AND n.ref_id = bob.user_id
  );

INSERT INTO reports (reporter_id, target_type, target_id, reason, evidence_image, status, admin_note, handled_by)
SELECT
  charlie.user_id,
  'LISTING',
  l.listing_id,
  'Nghi van thong tin gia chua ro rang',
  'https://picsum.photos/seed/slife-report/800/600',
  'PENDING',
  NULL,
  NULL
FROM users charlie
JOIN listings l ON l.title = 'iPhone 12 64GB cu'
WHERE charlie.email = 'charlie@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM reports r WHERE r.reporter_id = charlie.user_id AND r.target_type = 'LISTING' AND r.target_id = l.listing_id
  );

COMMIT;
