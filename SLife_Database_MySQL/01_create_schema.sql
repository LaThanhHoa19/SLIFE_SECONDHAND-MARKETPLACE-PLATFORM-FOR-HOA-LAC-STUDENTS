-- 01_create_schema.sql
-- Complete schema for SLife (MySQL 8+)
-- Naming: plural table names, snake_case columns.

CREATE DATABASE IF NOT EXISTS `slife_db`
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_unicode_ci;
USE `slife_db`;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(50) NULL,
  avatar_url VARCHAR(1000) NULL,
  bio TEXT NULL,
  role ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  status ENUM('ACTIVE','BANNED','RESTRICTED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  reputation_score DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS addresses (
  address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  location_name VARCHAR(200) NOT NULL,
  address_text TEXT NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  parent_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listings (
  listing_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT NOT NULL,
  category_id BIGINT NULL,
  pickup_address_id BIGINT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  item_condition ENUM('NEW','USED_LIKE_NEW','USED_GOOD','USED_FAIR') NOT NULL DEFAULT 'USED_GOOD',
  status ENUM('DRAFT','ACTIVE','HIDDEN','SOLD','GIVEN_AWAY','BANNED') NOT NULL DEFAULT 'DRAFT',
  purpose ENUM('SALE','GIVEAWAY','FLASH') NOT NULL DEFAULT 'SALE',
  is_giveaway TINYINT(1) NOT NULL DEFAULT 0,
  expiration_date DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_listings_pickup_address FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
  CONSTRAINT chk_listings_giveaway_price CHECK (
    (is_giveaway = 0) OR (price = 0.00)
  ),
  INDEX idx_listings_status_created (status, created_at),
  INDEX idx_listings_category (category_id),
  INDEX idx_listings_seller (seller_id),
  INDEX idx_listings_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listing_images (
  image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  listing_id BIGINT NOT NULL,
  image_url VARCHAR(2000) NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_images_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  UNIQUE KEY uq_listing_images_listing_order (listing_id, display_order),
  INDEX idx_listing_images_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS configurations (
  config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  config_name VARCHAR(200) NOT NULL,
  config_value VARCHAR(2000) NOT NULL,
  description TEXT NULL,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_configurations_name UNIQUE (config_name),
  CONSTRAINT fk_configurations_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banned_keywords (
  banned_keyword_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_banned_keywords_keyword UNIQUE (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT NOT NULL,
  target_type ENUM('USER','LISTING') NOT NULL,
  target_id BIGINT NOT NULL,
  reason VARCHAR(255) NULL,
  evidence_image VARCHAR(2000) NULL,
  status ENUM('PENDING','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  admin_note TEXT NULL,
  handled_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_handler FOREIGN KEY (handled_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_reports_target (target_type, target_id),
  INDEX idx_reports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saved_listings (
  user_id BIGINT NOT NULL,
  listing_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id),
  CONSTRAINT fk_saved_listings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_listings_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS follows (
  follower_id BIGINT NOT NULL,
  followed_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followed FOREIGN KEY (followed_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id BIGINT NOT NULL,
  blocked_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT fk_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id1 BIGINT NOT NULL,
  user_id2 BIGINT NOT NULL,
  listing_id BIGINT NULL,
  last_message_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_user1 FOREIGN KEY (user_id1) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_user2 FOREIGN KEY (user_id2) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE SET NULL,
  CONSTRAINT chk_conversations_distinct_users CHECK (user_id1 <> user_id2),
  UNIQUE KEY uq_conversations_users_listing (user_id1, user_id2, listing_id),
  INDEX idx_conversations_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_messages_conversation_sent (conversation_id, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS offers (
  offer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  listing_id BIGINT NOT NULL,
  buyer_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','ACCEPTED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_offers_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  CONSTRAINT fk_offers_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_offers_listing (listing_id),
  INDEX idx_offers_buyer_status (buyer_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deals (
  deal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  listing_id BIGINT NOT NULL,
  proposed_by_id BIGINT NOT NULL,
  address_id BIGINT NULL,
  deal_price DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  pickup_time DATETIME NULL,
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deals_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_proposed_by FOREIGN KEY (proposed_by_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_address FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
  INDEX idx_deals_listing_status (listing_id, status),
  INDEX idx_deals_pickup_time (pickup_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  reviewer_id BIGINT NOT NULL,
  reviewee_id BIGINT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_reviews_reviewee (reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('MESSAGE','DEAL','FOLLOW','SYSTEM','REPORT') NOT NULL,
  ref_type VARCHAR(50) NULL,
  ref_id BIGINT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listing_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  listing_id BIGINT NOT NULL,
  changed_by BIGINT NULL,
  change_type VARCHAR(100) NOT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_history_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_listing_history_listing (listing_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
