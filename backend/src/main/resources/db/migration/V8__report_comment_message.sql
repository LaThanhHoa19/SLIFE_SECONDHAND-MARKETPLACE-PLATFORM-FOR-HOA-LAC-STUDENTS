-- Extend reports.target_type to support COMMENT/MESSAGE (SCRUM-228)
-- Keep backward compatible values USER/LISTING.

ALTER TABLE reports
    MODIFY COLUMN target_type ENUM('USER', 'LISTING', 'COMMENT', 'MESSAGE') NOT NULL;

CREATE INDEX idx_reports_target ON reports (target_type, target_id);
