ALTER TABLE users
    ADD COLUMN phone_verified_at DATETIME NULL AFTER phone_number;
