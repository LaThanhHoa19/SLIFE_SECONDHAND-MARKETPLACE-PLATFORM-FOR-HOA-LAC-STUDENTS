-- Chuyển deals.status từ ENUM → VARCHAR để tránh "Data truncated for column 'status'"
-- khi giá trị trong Java (vd REJECTED) chưa khớp ENUM trên DB hoặc Flyway chưa chạy đủ.
ALTER TABLE deals
    MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'PENDING';
