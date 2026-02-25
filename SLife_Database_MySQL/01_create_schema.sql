-- 01_create_schema.sql
-- Schema creation for slife_db (MySQL 8+)
-- Idempotent statements where possible (CREATE ... IF NOT EXISTS).
-- Engine: InnoDB, Charset: utf8mb4.
-- Usage: run as a user with CREATE/ALTER privileges.
-- NOTE: This file intentionally leaves some business-rule enforcement
-- to application layer (e.g. price = 0 for giveaways). TODO comments included.

-- Disable FK checks to avoid ordering problems during initial creation
SET FOREIGN_KEY_CHECKS = 0;

-- Create database if not exists and use it
CREATE DATABASE IF NOT EXISTS `slife_db`
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_unicode_ci;
USE `slife_db`;

--------------------------------------------------------------------------------
-- Users
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
                                     user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512), -- store hashed password (bcrypt/argon2) or NULL if OAuth-only
    full_name VARCHAR(200),
    phone_number VARCHAR(50),
    avatar_url VARCHAR(1000),
    bio TEXT,
    role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE','BANNED','RESTRICTED','DELETED') NOT NULL DEFAULT 'ACTIVE',
    reputation_score FLOAT NOT NULL DEFAULT 5.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Addresses (pickup points)
-- NOTE: we intentionally DO NOT include reminder_time here (moved to deals via pickup_time + scheduler).
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
                                         address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         user_id BIGINT NOT NULL,
                                         location_name VARCHAR(200) NOT NULL, -- e.g. "Canteen Alpha", "Room A6"
    address_text TEXT NULL,
    lat DECIMAL(10,7) NULL,
    lng DECIMAL(10,7) NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Categories (multi-level via parent_id self-reference)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
                                          category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_name (name),
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Listings (product posts)
-- Business note: application must enforce price=0 when purpose='GIVEAWAY' or is_giveaway=1.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
                                        listing_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        seller_id BIGINT NOT NULL,
                                        category_id BIGINT NULL,
                                        title VARCHAR(300) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    condition ENUM('NEW','USED_LIKE_NEW','USED_GOOD','USED_FAIR') DEFAULT 'USED_GOOD',
    status ENUM('DRAFT','ACTIVE','HIDDEN','SOLD','GIVEN_AWAY','BANNED') DEFAULT 'DRAFT',
    is_giveaway TINYINT(1) NOT NULL DEFAULT 0,
    purpose ENUM('SALE','GIVEAWAY','FLASH') DEFAULT 'SALE',
    pickup_address_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
    INDEX idx_listings_status_created (status, created_at),
    INDEX idx_listings_title (title),
    INDEX idx_listings_category (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note for developers:
-- Application should perform final checks:
--   - if is_giveaway = 1 then price must be 0 (business rule)
--   - banned keywords scanning should be applied before insert/update

--------------------------------------------------------------------------------
-- Listing images
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_images (
                                              image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              listing_id BIGINT NOT NULL,
                                              image_url VARCHAR(2000),
    display_order INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    INDEX idx_listing_images_listing (listing_id, display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Configurations (key-value)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configurations (
                                              config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              config_name VARCHAR(200) NOT NULL UNIQUE,
    config_value VARCHAR(2000) NOT NULL,
    description TEXT,
    updated_by BIGINT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Banned keywords for automatic scanning
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banned_keywords (
                                               banned_keyword_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               keyword VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_banned_keyword (keyword)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Reports (user reports for listings or users)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
                                       report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       reporter_id BIGINT NOT NULL,
                                       target_id BIGINT NOT NULL,
                                       target_type ENUM('USER','LISTING') NOT NULL,
    reason VARCHAR(255),
    evidence_image VARCHAR(2000),
    status ENUM('PENDING','RESOLVED','REJECTED') DEFAULT 'PENDING',
    admin_note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Saved listings (wishlist) - many-to-many
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_listings (
                                              user_id BIGINT NOT NULL,
                                              listing_id BIGINT NOT NULL,
                                              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                              PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Follows (followers/following) - many-to-many
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
                                       follower_id BIGINT NOT NULL,
                                       followed_id BIGINT NOT NULL,
                                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Blocks (user blocks) - many-to-many
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
                                      blocker_id BIGINT NOT NULL,
                                      blocked_id BIGINT NOT NULL,
                                      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                      PRIMARY KEY (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Reviews (ratings)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
                                       review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       reviewer_id BIGINT NOT NULL,
                                       listing_id BIGINT NOT NULL,
                                       rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    INDEX idx_reviews_listing (listing_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Deals (transactions) - includes pickup_time and reminder_sent flag
-- pickup_time: time buyer & seller agree to pick up; scheduler will trigger reminders.
-- reminder_sent: scheduler (backend) sets this to 1 after sending reminder.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
                                     deal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     listing_id BIGINT NOT NULL,
                                     buyer_id BIGINT NOT NULL,
                                     seller_id BIGINT NOT NULL,
                                     price_agreed DECIMAL(12,2) NULL,
    pickup_address_id BIGINT NULL,
    pickup_time DATETIME NULL,                       -- <--- new field used by scheduler
    reminder_sent TINYINT(1) NOT NULL DEFAULT 0,     -- scheduler sets to 1 after sending
    status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
    INDEX idx_deals_pickup_time (pickup_time),
    INDEX idx_deals_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Conversations & Messages (chat)
-- A minimal schema to support 1-1 conversations around a listing or general
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
                                             conversation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             listing_id BIGINT NULL, -- conversation may refer to a listing
                                             user1_id BIGINT NOT NULL,
                                             user2_id BIGINT NOT NULL,
                                             last_message_at DATETIME NULL,
                                             created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE SET NULL,
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
                                        message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        conversation_id BIGINT NOT NULL,
                                        sender_id BIGINT NOT NULL,
                                        content TEXT,
                                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_messages_conversation (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Notifications table
-- Each record is for one user: clicking the notification in frontend should
-- redirect to related object (e.g. listing, deal, etc.) via type+ref_id or content.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
                                             notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT NOT NULL,         -- recipient
                                             type ENUM('MESSAGE','ORDER_UPDATE','SYSTEM_ALERT','FOLLOW','REPORT') NOT NULL,
    ref_type VARCHAR(50) NULL,       -- e.g. 'LISTING','DEAL','CONVERSATION'
    ref_id BIGINT NULL,              -- id of the referenced object
    content TEXT,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Offers (buyer proposals)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offers (
                                      offer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                      listing_id BIGINT NOT NULL,
                                      buyer_id BIGINT NOT NULL,
                                      amount DECIMAL(12,2) NOT NULL,
    status ENUM('PENDING','ACCEPTED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_offers_listing (listing_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- Listing history (audit)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_history (
                                               history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               listing_id BIGINT NOT NULL,
                                               changed_by BIGINT NULL,
                                               change_type VARCHAR(100), -- e.g. 'STATUS_CHANGE','PRICE_UPDATE'
    before_state TEXT,
    after_state TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--------------------------------------------------------------------------------
-- End of schema objects
--------------------------------------------------------------------------------

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Quick checklist comments (for devs):
-- TODO: Consider adding full-text indexes for listings.title and description if search requires it.
-- TODO: If GDPR or personal-data policy applies, consider encryption or truncation for phone_number.
-- TODO: Convert to Flyway/Liquibase migrations (V1__init.sql) if you use schema migration tooling.
