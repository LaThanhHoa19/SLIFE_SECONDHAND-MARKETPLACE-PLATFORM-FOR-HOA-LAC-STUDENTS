-- Migration V20: Update default reputation_score from 5.00 to 0.00
-- This ensures that new users start with a clean score and are only rated after their first successful transaction.

ALTER TABLE users MODIFY COLUMN reputation_score DECIMAL(3,2) NOT NULL DEFAULT 0.00;
