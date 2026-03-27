-- Add reply/quote references for chat messages (SCRUM-225).
ALTER TABLE messages
    ADD COLUMN reply_to_message_id BIGINT NULL,
    ADD COLUMN quote_message_id BIGINT NULL;

ALTER TABLE messages
    ADD INDEX idx_messages_reply_to (reply_to_message_id),
    ADD INDEX idx_messages_quote (quote_message_id);

ALTER TABLE messages
    ADD CONSTRAINT fk_messages_reply_to
        FOREIGN KEY (reply_to_message_id) REFERENCES messages(message_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_messages_quote
        FOREIGN KEY (quote_message_id) REFERENCES messages(message_id) ON DELETE SET NULL;
