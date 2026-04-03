-- deals.status: Java dùng REJECTED khi người mua từ chối sau khi bán chốt đơn (buyerRejectPendingDeal).
-- Trước đây ENUM thiếu REJECTED → MySQL báo "Data truncated for column 'status'".
ALTER TABLE deals
    MODIFY COLUMN status ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
