-- Community posts (cộng đồng): tương tự listing nhưng không price/category/condition; hashtag thay category.
-- Báo cáo: mở rộng target_type.

CREATE TABLE IF NOT EXISTS community_posts (
    post_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    author_id       BIGINT NOT NULL,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    view_count      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at      DATETIME(6) NULL,
    hidden_at       DATETIME(6) NULL,
    CONSTRAINT fk_community_posts_author FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE,
    KEY idx_community_posts_status_created (status, created_at),
    KEY idx_community_posts_author (author_id)
);

CREATE TABLE IF NOT EXISTS community_post_images (
    image_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id         BIGINT NOT NULL,
    image_url       VARCHAR(2000) NOT NULL,
    display_order   INT NOT NULL DEFAULT 1,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NULL,
    deleted_at      DATETIME(6) NULL,
    CONSTRAINT fk_cpi_post FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hashtags (
    hashtag_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    tag             VARCHAR(100) NOT NULL,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_hashtags_tag (tag)
);

CREATE TABLE IF NOT EXISTS community_post_hashtags (
    post_id         BIGINT NOT NULL,
    hashtag_id      BIGINT NOT NULL,
    PRIMARY KEY (post_id, hashtag_id),
    CONSTRAINT fk_cph_post FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_cph_hashtag FOREIGN KEY (hashtag_id) REFERENCES hashtags (hashtag_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_post_comments (
    comment_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    content              TEXT NULL,
    user_id              BIGINT NOT NULL,
    post_id              BIGINT NOT NULL,
    parent_comment_id    BIGINT NULL,
    created_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6) NULL,
    deleted_at           DATETIME(6) NULL,
    hidden_at            DATETIME(6) NULL,
    CONSTRAINT fk_cpc_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cpc_post FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_cpc_parent FOREIGN KEY (parent_comment_id) REFERENCES community_post_comments (comment_id) ON DELETE CASCADE,
    KEY idx_cpc_post_created (post_id, created_at)
);

CREATE TABLE IF NOT EXISTS community_post_comment_images (
    image_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id  BIGINT NOT NULL,
    image_url   VARCHAR(2000) NOT NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NULL,
    deleted_at  DATETIME(6) NULL,
    CONSTRAINT fk_cpci_comment FOREIGN KEY (comment_id) REFERENCES community_post_comments (comment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_post_likes (
    user_id     BIGINT NOT NULL,
    post_id     BIGINT NOT NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, post_id),
    KEY idx_cpl_post (post_id),
    CONSTRAINT fk_cpl_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cpl_post FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE
);

ALTER TABLE reports
    MODIFY COLUMN target_type ENUM(
        'USER',
        'LISTING',
        'COMMENT',
        'MESSAGE',
        'COMMUNITY_POST',
        'COMMUNITY_POST_COMMENT'
    ) NOT NULL;
