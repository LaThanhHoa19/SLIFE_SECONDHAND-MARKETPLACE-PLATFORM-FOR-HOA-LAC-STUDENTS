-- Hỗ trợ job expiry (WHERE status + expiration_date) và catalog ACTIVE có lọc hạn
CREATE INDEX idx_listings_status_expiration ON listings (status, expiration_date);
CREATE INDEX idx_listings_title ON listings (title);
