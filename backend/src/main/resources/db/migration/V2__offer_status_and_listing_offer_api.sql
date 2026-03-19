-- SCRUM-71: OfferStatus table + Offer schema normalization.
-- SCRUM-72: Data shape support for POST /api/listings/{id}/offers.

CREATE TABLE IF NOT EXISTS offer_statuses (
    status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(255)
);

INSERT INTO offer_statuses (code, label)
VALUES
    ('PENDING', 'Pending'),
    ('ACCEPTED', 'Accepted'),
    ('REJECTED', 'Rejected'),
    ('EXPIRED', 'Expired')
ON DUPLICATE KEY UPDATE label = VALUES(label);

ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS proposed_price DECIMAL(12, 2) NULL,
    ADD COLUMN IF NOT EXISTS message TEXT NULL,
    ADD COLUMN IF NOT EXISTS status_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS conversation_id BIGINT NULL;

UPDATE offers
SET proposed_price = amount
WHERE proposed_price IS NULL;

UPDATE offers o
JOIN offer_statuses s
  ON s.code = CASE
      WHEN o.status = 'ACCEPTED' THEN 'ACCEPTED'
      WHEN o.status = 'REJECTED' THEN 'REJECTED'
      WHEN o.status = 'EXPIRED' THEN 'EXPIRED'
      ELSE 'PENDING'
  END
SET o.status_id = s.status_id
WHERE o.status_id IS NULL;

ALTER TABLE offers
    MODIFY COLUMN proposed_price DECIMAL(12, 2) NOT NULL,
    MODIFY COLUMN status_id BIGINT NOT NULL;

ALTER TABLE offers
    ADD CONSTRAINT fk_offers_status
        FOREIGN KEY (status_id) REFERENCES offer_statuses(status_id),
    ADD CONSTRAINT fk_offers_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id);

CREATE INDEX idx_offers_listing_buyer ON offers(listing_id, buyer_id);
CREATE INDEX idx_offers_status_id ON offers(status_id);

ALTER TABLE notifications
    MODIFY COLUMN type ENUM('MESSAGE', 'DEAL', 'FOLLOW', 'SYSTEM', 'REPORT', 'OFFER') NOT NULL;
