-- ==========================================================
-- FLYWAY MIGRATION: V2__phone_number_verified.sql
-- DESCRIPTION: Add phone number verification flag for profile display
-- ==========================================================

ALTER TABLE users
    ADD COLUMN phone_number_verified TINYINT(1) NOT NULL DEFAULT 0;

