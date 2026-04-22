-- Extend reports.target_type to support COMMENT/MESSAGE (SCRUM-228)
-- Keep backward compatible values USER/LISTING.

ALTER TABLE reports
    MODIFY COLUMN target_type ENUM('USER', 'LISTING', 'COMMENT', 'MESSAGE') NOT NULL;

-- Bỏ dòng lệnh CREATE INDEX vì index idx_reports_target đã có sẵn từ Script V1:
-- CREATE INDEX idx_reports_target ON reports (target_type, target_id);
