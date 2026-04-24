ALTER TABLE users
    ADD COLUMN show_phone_number BIT(1) NOT NULL DEFAULT b'1' AFTER phone_number;
