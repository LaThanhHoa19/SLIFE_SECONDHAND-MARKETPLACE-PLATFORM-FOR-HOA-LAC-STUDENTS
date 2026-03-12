CREATE TABLE IF NOT EXISTS comments (
  comment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  user_id BIGINT NOT NULL,
  listing_id BIGINT NOT NULL,
  parent_comment_id BIGINT NULL,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
  INDEX idx_comments_listing (listing_id),
  INDEX idx_comments_parent (parent_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;