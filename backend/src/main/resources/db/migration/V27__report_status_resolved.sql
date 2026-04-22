-- Ensure moderation approvals can persist the final resolved state.
-- Older schemas only allowed PENDING/REJECTED, which caused
-- "Data truncated for column 'status'" when admin approved a report.

ALTER TABLE reports
    MODIFY COLUMN status ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING';
