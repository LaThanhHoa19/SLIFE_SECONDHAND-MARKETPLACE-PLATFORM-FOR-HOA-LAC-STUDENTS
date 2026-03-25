-- ==========================================================
-- FLYWAY MIGRATION: V3__add_chat_columns.sql
-- DESCRIPTION: Thêm các cột bị thiếu cho chat system
--   - conversations: session_uuid (UUID duy nhất), status
--   - messages: message_type, file_url
-- ==========================================================

-- ── 1. Bảng conversations ──────────────────────────────────────────────────

ALTER TABLE conversations
    ADD COLUMN session_uuid VARCHAR(36)  NULL,
    ADD COLUMN status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE';

-- Sinh UUID cho tất cả conversation hiện có
UPDATE conversations
SET session_uuid = UUID()
WHERE session_uuid IS NULL OR session_uuid = '';

-- Enforce NOT NULL sau khi đã có data
ALTER TABLE conversations
    MODIFY COLUMN session_uuid VARCHAR(36) NOT NULL;

-- Đặt UNIQUE constraint
ALTER TABLE conversations
    ADD UNIQUE KEY UK_conversations_session_uuid (session_uuid);

-- ── 2. Bảng messages ───────────────────────────────────────────────────────

ALTER TABLE messages
    ADD COLUMN message_type VARCHAR(30)   NOT NULL DEFAULT 'TEXT',
    ADD COLUMN file_url     VARCHAR(1000) NULL;
