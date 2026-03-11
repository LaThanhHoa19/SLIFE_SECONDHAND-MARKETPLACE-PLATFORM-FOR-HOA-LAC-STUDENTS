-- Add message_type and file_url to support multimedia & negotiation messages
ALTER TABLE messages
  ADD COLUMN message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT' AFTER is_read,
  ADD COLUMN file_url VARCHAR(1000) NULL AFTER message_type;

-- Index for fast lookup by message_type (e.g., count OFFER_PROPOSAL per listing)
ALTER TABLE messages ADD INDEX idx_messages_type (message_type);
