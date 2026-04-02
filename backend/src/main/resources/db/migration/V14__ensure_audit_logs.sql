-- Bảng audit_logs nằm trong V12 cùng ALTER comments; nếu V12 lỗi giữa chừng hoặc DB cũ chưa migrate,
-- xử lý báo cáo (từ chối/chấp nhận) sẽ gọi AuditLogService và crash với "audit_logs doesn't exist".
-- Migration này idempotent: chỉ tạo bảng khi chưa có.

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
