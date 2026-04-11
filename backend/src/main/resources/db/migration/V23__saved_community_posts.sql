CREATE TABLE IF NOT EXISTS saved_community_posts (
                                                     user_id     BIGINT NOT NULL,
                                                     post_id     BIGINT NOT NULL,
                                                     created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, post_id),
    KEY idx_scp_post (post_id),
    CONSTRAINT fk_scp_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_scp_post FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE
    );
