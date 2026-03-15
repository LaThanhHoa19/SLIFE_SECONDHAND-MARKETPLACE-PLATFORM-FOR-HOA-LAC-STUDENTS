-- ==========================================================
-- FLYWAY MIGRATION: V1__newdb.sql
-- AUTHOR: Do Thanh An
-- DESCRIPTION: Full Schema + Seed Data (consolidated, all fixes included)
--
-- Thay doi so voi ban goc:
--   - comments.content: NULL (cho phep comment chi co anh)
--   - comments.parent_comment_id: ON DELETE CASCADE (cascade xoa reply)
--   - comment_images.comment_id: ON DELETE CASCADE (cascade xoa anh)
-- ==========================================================

-- ============================================================
-- I. CAU TRUC BANG (DDL)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(200) NOT NULL,
    phone_number    VARCHAR(50),
    avatar_url      VARCHAR(1000),
    cover_image_url VARCHAR(1000),
    bio             TEXT,
    role            ENUM('ADMIN', 'USER') DEFAULT 'USER',
    status          ENUM('ACTIVE', 'BANNED', 'RESTRICTED', 'DELETED') DEFAULT 'ACTIVE',
    reputation_score DECIMAL(3, 2) DEFAULT 5.00,
    violation_count INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id   BIGINT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS addresses (
    address_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    address_text  TEXT,
    map_url       TEXT,
    lat           DECIMAL(10, 7),
    lng           DECIMAL(10, 7),
    is_default    TINYINT(1) DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at    DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS listings (
    listing_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    seller_id         BIGINT NOT NULL,
    category_id       BIGINT,
    pickup_address_id BIGINT,
    title             VARCHAR(300) NOT NULL,
    description       TEXT,
    price             DECIMAL(12, 2) DEFAULT 0.00,
    item_condition    ENUM('NEW', 'USED_LIKE_NEW', 'USED_GOOD', 'USED_FAIR') DEFAULT 'USED_GOOD',
    status            ENUM('DRAFT', 'ACTIVE', 'HIDDEN', 'SOLD', 'GIVEN_AWAY', 'BANNED', 'DELETED') DEFAULT 'DRAFT',
    purpose           ENUM('SALE', 'GIVEAWAY', 'FLASH') DEFAULT 'SALE',
    is_giveaway       TINYINT(1) DEFAULT 0,
    expiration_date   DATETIME,
    view_count        BIGINT DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME DEFAULT NULL,
    FOREIGN KEY (seller_id)         REFERENCES users(user_id),
    FOREIGN KEY (category_id)       REFERENCES categories(category_id),
    FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id)
);

CREATE TABLE IF NOT EXISTS listing_images (
    image_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    listing_id    BIGINT NOT NULL,
    image_url     VARCHAR(2000) NOT NULL,
    display_order INT DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at    DATETIME DEFAULT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id1        BIGINT NOT NULL,
    user_id2        BIGINT NOT NULL,
    listing_id      BIGINT,
    last_message_at DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id1)    REFERENCES users(user_id),
    FOREIGN KEY (user_id2)    REFERENCES users(user_id),
    FOREIGN KEY (listing_id)  REFERENCES listings(listing_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id       BIGINT NOT NULL,
    content         TEXT NOT NULL,
    is_read         TINYINT(1) DEFAULT 0,
    sent_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    FOREIGN KEY (sender_id)       REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS message_images (
    image_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    image_url  VARCHAR(2000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
);

CREATE TABLE IF NOT EXISTS offers (
    offer_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    listing_id BIGINT NOT NULL,
    buyer_id   BIGINT NOT NULL,
    amount     DECIMAL(12, 2) NOT NULL,
    status     ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id),
    FOREIGN KEY (buyer_id)   REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS deals (
    deal_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    listing_id      BIGINT NOT NULL,
    proposed_by_id  BIGINT NOT NULL,
    offer_id        BIGINT NULL,
    address_id      BIGINT,
    deal_price      DECIMAL(12, 2) NOT NULL,
    status          ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    confirmed_at    DATETIME DEFAULT NULL,
    pickup_time     DATETIME,
    reminder_sent   TINYINT(1) DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL,
    FOREIGN KEY (conversation_id)  REFERENCES conversations(conversation_id),
    FOREIGN KEY (listing_id)       REFERENCES listings(listing_id),
    FOREIGN KEY (proposed_by_id)   REFERENCES users(user_id),
    FOREIGN KEY (address_id)       REFERENCES addresses(address_id),
    FOREIGN KEY (offer_id)         REFERENCES offers(offer_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    reviewer_id     BIGINT NOT NULL,
    reviewee_id     BIGINT NOT NULL,
    rating          TINYINT NOT NULL,
    comment         TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    FOREIGN KEY (reviewer_id)     REFERENCES users(user_id),
    FOREIGN KEY (reviewee_id)     REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS review_images (
    image_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(2000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id)
);

-- [V3] content NULL: cho phep comment chi co anh, khong bat buoc text
-- [V4] parent_comment_id ON DELETE CASCADE: xoa parent tu dong xoa reply
CREATE TABLE IF NOT EXISTS comments (
    comment_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    content           TEXT NULL,
    user_id           BIGINT NOT NULL,
    listing_id        BIGINT NOT NULL,
    parent_comment_id BIGINT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id)           REFERENCES users(user_id),
    FOREIGN KEY (listing_id)        REFERENCES listings(listing_id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

-- [V5] comment_id ON DELETE CASCADE: xoa comment tu dong xoa anh cua no
CREATE TABLE IF NOT EXISTS comment_images (
    image_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id BIGINT NOT NULL,
    image_url  VARCHAR(2000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    report_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,
    target_type ENUM('USER', 'LISTING') NOT NULL,
    target_id   BIGINT NOT NULL,
    reason      VARCHAR(255),
    status      ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
    admin_note  TEXT,
    handled_by  BIGINT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id),
    FOREIGN KEY (handled_by)  REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS report_images (
    image_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
    report_id BIGINT NOT NULL,
    image_url VARCHAR(2000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(report_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    type            ENUM('MESSAGE', 'DEAL', 'FOLLOW', 'SYSTEM', 'REPORT') NOT NULL,
    ref_type        VARCHAR(50),
    ref_id          BIGINT,
    content         TEXT NOT NULL,
    is_read         TINYINT(1) DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS follows (
    follower_id BIGINT NOT NULL,
    followed_id BIGINT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id),
    FOREIGN KEY (followed_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS saved_listings (
    user_id    BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id)
);

CREATE TABLE IF NOT EXISTS blocks (
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(user_id),
    FOREIGN KEY (blocked_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS banned_keywords (
    banned_keyword_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    keyword           VARCHAR(255) NOT NULL UNIQUE,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS configurations (
    config_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_name  VARCHAR(200) NOT NULL UNIQUE,
    config_value VARCHAR(2000) NOT NULL,
    description  TEXT,
    updated_by   BIGINT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at   DATETIME DEFAULT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS listing_history (
    history_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    listing_id   BIGINT NOT NULL,
    changed_by   BIGINT,
    change_type  VARCHAR(100) NOT NULL,
    before_state JSON,
    after_state  JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at   DATETIME DEFAULT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id),
    FOREIGN KEY (changed_by) REFERENCES users(user_id)
);


-- ============================================================
-- II. DU LIEU MAU (DML) - cha truoc, con sau
-- ============================================================

-- 1. Users
INSERT INTO users (user_id, email, full_name, role, status, reputation_score) VALUES
(1, 'admin@fpt.edu.vn',        'Lai Thi Thanh Hoa',  'ADMIN', 'ACTIVE',      5.0),
(2, 'andthe180695@fpt.edu.vn', 'Do Thanh An',         'USER',  'ACTIVE',      4.8),
(3, 'vietldhe180008@fpt.edu.vn','Le Duc Viet',        'USER',  'ACTIVE',      4.5),
(4, 'anhttnhe186474@fpt.edu.vn','Tran Thi Ngoc Anh',  'USER',  'ACTIVE',      4.9),
(5, 'tuhahe173373@fpt.edu.vn', 'Hoang Anh Tu',        'USER',  'RESTRICTED',  3.0);

-- 2. Categories
INSERT INTO categories (category_id, name, description) VALUES
(1, 'Giao trinh & Tai lieu', 'Sach, vo, giao trinh cac mon hoc tai FU'),
(2, 'Do dien tu',            'Laptop, chuot, ban phim, tai nghe'),
(3, 'Do dung KTX',           'Quat, am sieu toc, gia sach, den hoc');

-- 3. Addresses
INSERT INTO addresses (address_id, user_id, location_name, address_text, map_url) VALUES
(1, 2, 'Ky tuc xa Dom A', 'Phong 402, Dom A, DH FPT', 'https://www.google.com/maps/embed?pb=...'),
(2, 3, 'Ky tuc xa Dom E', 'Phong 105, Dom E, DH FPT', 'https://www.google.com/maps/embed?pb=...'),
(3, 4, 'Toa nha Alpha',   'Sanh tang 1, Toa Alpha',   'https://www.google.com/maps/embed?pb=...');

-- 4. Listings
INSERT INTO listings (listing_id, seller_id, category_id, pickup_address_id, title, price, status) VALUES
(1, 2, 1, 1, 'Giao trinh MAD101 & OSG202', 150000.00, 'ACTIVE'),
(2, 3, 2, 2, 'Chuot Logitech G304 cu',     300000.00, 'ACTIVE'),
(3, 4, 3, 3, 'Am sieu toc 1.8L con moi',       0.00, 'ACTIVE');

-- 5. Listing Images (4 anh moi bai)
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

-- 6. Conversations & Messages
INSERT INTO conversations (conversation_id, user_id1, user_id2, listing_id) VALUES (1, 4, 2, 1);
INSERT INTO messages (message_id, conversation_id, sender_id, content) VALUES
(1, 1, 4, 'Chao ban, giao trinh MAD con moi khong a?'),
(2, 1, 2, 'Chao ban, sach minh moi dung 1 ky, khong viet ve gi vao dau.'),
(3, 1, 4, 'Oki ban, 120k duoc khong minh qua Dom A lay luon?'),
(4, 1, 2, 'Thoi minh de dung 150k ban nhe, sach hiem a.'),
(5, 1, 4, 'Vang the ban gui minh anh thuc te voi.');

-- 7. Message Images
INSERT INTO message_images (message_id, image_url) VALUES
(5, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800'),
(5, 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=800');

-- 8. Deals
INSERT INTO deals (deal_id, conversation_id, listing_id, proposed_by_id, deal_price, status, confirmed_at) VALUES
(1, 1, 1, 4, 150000.00, 'CONFIRMED', '2026-03-10 10:00:00');

-- 9. Reviews & Images
INSERT INTO reviews (review_id, conversation_id, reviewer_id, reviewee_id, rating, comment) VALUES
(1, 1, 4, 2, 5, 'Nguoi ban nhiet tinh, sach dung nhu mo ta!');
INSERT INTO review_images (review_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1627933604052-a058e0345204?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1566417713040-083f24a03761?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800');

-- 10. Comments & Images (co anh, co text)
INSERT INTO comments (comment_id, user_id, listing_id, content) VALUES
(1, 3, 1, 'Co ship sang Dom E khong chu thot?');
INSERT INTO comment_images (comment_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1454165833267-02306283731c?q=80&w=800');

-- 11. Reports & Images
INSERT INTO reports (report_id, reporter_id, target_type, target_id, reason, status) VALUES
(1, 4, 'USER', 5, 'Gui link lua dao trong chat', 'RESOLVED');
INSERT INTO report_images (report_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1579389083046-e3df9c2b3325?q=80&w=800'),
(1, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800');

-- 12. Saved Listings
INSERT INTO saved_listings (user_id, listing_id) VALUES (2, 2), (4, 2);