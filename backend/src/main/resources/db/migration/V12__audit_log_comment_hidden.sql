-- SCRUM-232: audit trail + comment moderation (hidden_at)

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    occurred_at   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actor_user_id BIGINT NULL,
    actor_type    VARCHAR(32)  NOT NULL DEFAULT 'ADMIN',
    action        VARCHAR(96)  NOT NULL,
    entity_type   VARCHAR(48)  NOT NULL,
    entity_id     BIGINT NULL,
    payload_json  TEXT NULL,
    INDEX idx_audit_occurred (occurred_at DESC),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

ALTER TABLE comments
    ADD COLUMN hidden_at TIMESTAMP(6) NULL DEFAULT NULL;

-- Default threshold: auto-hide when pending report count >= 3 (same family as REPORT_THRESHOLD)
INSERT INTO configurations (config_name, config_value, description)
VALUES (
    'AUTO_HIDE_REPORT_THRESHOLD',
    '3',
    'Auto-hide listing (HIDDEN) or comment (hidden_at) when PENDING report count reaches this value'
)
ON DUPLICATE KEY UPDATE config_name = config_name;
