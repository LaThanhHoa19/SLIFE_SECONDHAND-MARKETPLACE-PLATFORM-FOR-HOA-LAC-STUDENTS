-- Chat session: add status and session_uuid to conversations (ChatSession)
ALTER TABLE conversations
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' AFTER listing_id,
  ADD COLUMN session_uuid CHAR(36) NULL UNIQUE AFTER status;

-- Backfill session_uuid (MySQL evaluates UUID() per row)
UPDATE conversations SET session_uuid = UUID() WHERE session_uuid IS NULL;
ALTER TABLE conversations MODIFY session_uuid CHAR(36) NOT NULL;

-- Add conversation_id to offers (session_id in spec)
ALTER TABLE offers ADD COLUMN conversation_id BIGINT NULL AFTER offer_id;
ALTER TABLE offers ADD CONSTRAINT fk_offers_conversation
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE SET NULL;
ALTER TABLE offers ADD INDEX idx_offers_conversation (conversation_id);

-- Add offer_id to deals
ALTER TABLE deals ADD COLUMN offer_id BIGINT NULL AFTER deal_id;
ALTER TABLE deals ADD CONSTRAINT fk_deals_offer
  FOREIGN KEY (offer_id) REFERENCES offers(offer_id) ON DELETE SET NULL;
ALTER TABLE deals ADD INDEX idx_deals_offer (offer_id);
