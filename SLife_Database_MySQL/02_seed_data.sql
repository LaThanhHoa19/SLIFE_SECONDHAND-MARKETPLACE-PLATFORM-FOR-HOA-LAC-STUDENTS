-- 02_seed_data.sql
-- Seed data for slife_db. Run AFTER 01_create_schema.sql.
-- Use transactions and idempotent inserts where reasonable.
USE `slife_db`;

START TRANSACTION;

--------------------------------------------------------------------------------
-- Admin + sample users
-- NOTE: password_hash placeholders. Replace with properly hashed passwords or
-- create accounts via registration endpoints.
--------------------------------------------------------------------------------
INSERT INTO users (email, password_hash, full_name, phone_number, role, status, reputation_score)
VALUES
    ('admin@example.com', NULL, 'System Admin', '0000000000', 'ADMIN', 'ACTIVE', 5.0),
    ('alice@example.com', NULL, 'Alice Nguyen', '0912345678', 'USER', 'ACTIVE', 5.0),
    ('bob@example.com', NULL, 'Bob Tran', '0987654321', 'USER', 'ACTIVE', 5.0)
    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Retrieve user IDs for seeded users (for clarity in later inserts)
-- NOTE: adapt queries in code if you want to compute IDs. We'll assume:
--   admin = id 1 (if DB was empty) but NOT rely on that in production.

--------------------------------------------------------------------------------
-- Configurations (key-value)
--------------------------------------------------------------------------------
INSERT INTO configurations (config_name, config_value, description, updated_by)
VALUES
    ('listing_expiration_days', '3', 'Default number of days before an active listing expires', NULL),
    ('max_posts_per_day', '5', 'Default daily post limit for new/spam flagged users', NULL),
    ('auto_confirm_days', '3', 'System auto-confirms completed deals after this many days of inactivity', NULL)
    ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = CURRENT_TIMESTAMP;

--------------------------------------------------------------------------------
-- Banned keywords
--------------------------------------------------------------------------------
INSERT IGNORE INTO banned_keywords (keyword) VALUES
  ('ma túy'),
  ('súng đạn'),
  ('ma tuy'),
  ('heroin'),
  ('firearm');

--------------------------------------------------------------------------------
-- Categories (multi-level)
-- For parent_id values we use subselects so it is idempotent and robust.
--------------------------------------------------------------------------------
-- Top-level categories
INSERT INTO categories (name, description, parent_id)
VALUES
    ('Electronics', 'Phones, laptops and accessories', NULL),
    ('Furniture', 'Home and office furniture', NULL),
    ('Books', 'Textbooks and novels', NULL)
    ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert some child categories using SELECT to find parent ids (idempotent)
INSERT INTO categories (name, description, parent_id)
SELECT 'Phones', 'Mobile phones and accessories', c.category_id
FROM categories c WHERE c.name = 'Electronics'
    ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO categories (name, description, parent_id)
SELECT 'Laptops', 'Laptop computers and accessories', c.category_id
FROM categories c WHERE c.name = 'Electronics'
    ON DUPLICATE KEY UPDATE description = VALUES(description);

--------------------------------------------------------------------------------
-- Addresses for sample users
--------------------------------------------------------------------------------
-- get user ids via subselects
INSERT INTO addresses (user_id, location_name, address_text, lat, lng, is_default)
SELECT u.user_id, 'Dorm A - Room 101', 'Block A room 101, Hoa Lac', NULL, NULL, 1
FROM users u WHERE u.email = 'alice@example.com'
    ON DUPLICATE KEY UPDATE address_text = VALUES(address_text);

INSERT INTO addresses (user_id, location_name, address_text, lat, lng, is_default)
SELECT u.user_id, 'Canteen Alpha', 'Near main canteen, Hoa Lac', NULL, NULL, 1
FROM users u WHERE u.email = 'bob@example.com'
    ON DUPLICATE KEY UPDATE address_text = VALUES(address_text);

--------------------------------------------------------------------------------
-- Sample listings (include one giveaway with price=0)
--------------------------------------------------------------------------------
-- Get referenced ids
-- Insert an active sale listing
INSERT INTO listings (seller_id, category_id, title, description, price, condition, status, is_giveaway, purpose, pickup_address_id)
SELECT s.user_id, cat.category_id, 'Iphone 7plus cũ hơi trầy xước nhẹ', 'Iphone 7plus, cũ, trầy xước nhẹ, pin 80%', 1200000.00, 'USED_GOOD', 'ACTIVE', 0, 'SALE', a.address_id
FROM users s
         JOIN categories cat ON cat.name = 'Phones'
         LEFT JOIN addresses a ON a.user_id = s.user_id
WHERE s.email = 'alice@example.com'
    LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title), price = VALUES(price);

-- Insert a giveaway listing (price must be 0)
INSERT INTO listings (seller_id, category_id, title, description, price, condition, status, is_giveaway, purpose, pickup_address_id)
SELECT s.user_id, cat.category_id, 'Bàn gỗ tặng miễn phí', 'Dọn nhà tặng bàn gỗ, lấy tại Canteen Alpha', 0.00, 'USED_GOOD', 'ACTIVE', 1, 'GIVEAWAY',
       (SELECT address_id FROM addresses WHERE user_id = s.user_id LIMIT 1)
FROM users s
    JOIN categories cat ON cat.name = 'Furniture'
WHERE s.email = 'bob@example.com'
    LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status);

--------------------------------------------------------------------------------
-- Listing images (seed small demo images)
--------------------------------------------------------------------------------
-- For listing created by Alice (assumes title match)
INSERT INTO listing_images (listing_id, image_url, display_order)
SELECT l.listing_id, 'https://example.com/images/iphone7-1.jpg', 1
FROM listings l WHERE l.title LIKE '%Iphone 7plus%'
    ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

INSERT INTO listing_images (listing_id, image_url, display_order)
SELECT l.listing_id, 'https://example.com/images/iphone7-2.jpg', 2
FROM listings l WHERE l.title LIKE '%Iphone 7plus%'
    ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

--------------------------------------------------------------------------------
-- Saved listings & follows
--------------------------------------------------------------------------------
-- Alice saves Bob's giveaway (if both exist)
INSERT IGNORE INTO saved_listings (user_id, listing_id)
SELECT u.user_id, l.listing_id
FROM users u, listings l
WHERE u.email = 'alice@example.com' AND l.title LIKE '%Bàn gỗ tặng%';

-- Follow: Alice follows Bob
INSERT IGNORE INTO follows (follower_id, followed_id)
SELECT a.user_id, b.user_id
FROM users a, users b
WHERE a.email = 'alice@example.com' AND b.email = 'bob@example.com';

--------------------------------------------------------------------------------
-- Seed a deal with pickup_time (confirmed) for demo
--------------------------------------------------------------------------------
-- Create a deal: Alice buys Alice's own? For demonstration we create Bob->Alice or inverse:
-- We'll find a sale listing (Iphone) and create a deal between buyer Bob and seller Alice
INSERT INTO deals (listing_id, buyer_id, seller_id, price_agreed, pickup_address_id, pickup_time, reminder_sent, status)
SELECT l.listing_id,
       (SELECT user_id FROM users WHERE email = 'bob@example.com' LIMIT 1) AS buyer_id,
       (SELECT user_id FROM users WHERE email = 'alice@example.com' LIMIT 1) AS seller_id,
       1150000.00,
       (SELECT address_id FROM addresses WHERE user_id = (SELECT user_id FROM users WHERE email = 'bob@example.com') LIMIT 1),
       -- Example pickup_time (adjust as desired): 2 days from now (use explicit datetime if needed)
       DATE_ADD(NOW(), INTERVAL 2 DAY),
       0,
       'CONFIRMED'
FROM listings l
WHERE l.title LIKE '%Iphone 7plus%'
    LIMIT 1
ON DUPLICATE KEY UPDATE status = VALUES(status);

--------------------------------------------------------------------------------
-- Reviews sample
--------------------------------------------------------------------------------
INSERT INTO reviews (reviewer_id, listing_id, rating, comment)
SELECT (SELECT user_id FROM users WHERE email = 'bob@example.com'),
       l.listing_id,
       5,
       'Máy dùng tốt, cảm ơn!'
FROM listings l WHERE l.title LIKE '%Iphone 7plus%'
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment);

--------------------------------------------------------------------------------
-- Notifications demo: when Bob follows Alice or when a listing is posted, system will generate notifications.
--------------------------------------------------------------------------------
INSERT INTO notifications (user_id, type, ref_type, ref_id, content, is_read)
SELECT (SELECT user_id FROM users WHERE email = 'alice@example.com'),
       'FOLLOW', NULL, NULL,
       'Bob bắt đầu theo dõi bạn', 0
    WHERE EXISTS (SELECT 1 FROM users WHERE email = 'bob@example.com')
LIMIT 1;

--------------------------------------------------------------------------------
-- Offers demo (buyer proposes new price)
--------------------------------------------------------------------------------
INSERT INTO offers (listing_id, buyer_id, amount, status)
SELECT l.listing_id, (SELECT user_id FROM users WHERE email = 'bob@example.com'), 1100000.00, 'PENDING'
FROM listings l WHERE l.title LIKE '%Iphone 7plus%'
    ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = VALUES(status);

--------------------------------------------------------------------------------
-- Commit seed data
--------------------------------------------------------------------------------
COMMIT;

-- Seed notes / TODOs:
-- - Replace password_hash NULLs with real hashed passwords or use OAuth for login.
-- - Adjust pickup_time example to real datetimes according to your timezone.
-- - If you use Flyway, convert to V2__seed.sql or load via application initializer.
