-- listing_likes for POST /api/listings/{id}/like (ListingLike entity).
CREATE TABLE IF NOT EXISTS listing_likes (
                                             user_id    BIGINT NOT NULL,
                                             listing_id BIGINT NOT NULL,
                                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             PRIMARY KEY (user_id, listing_id),
    KEY idx_listing_likes_listing_id (listing_id),
    CONSTRAINT fk_listing_likes_user
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_listing_likes_listing
    FOREIGN KEY (listing_id) REFERENCES listings (listing_id) ON DELETE CASCADE
    );
