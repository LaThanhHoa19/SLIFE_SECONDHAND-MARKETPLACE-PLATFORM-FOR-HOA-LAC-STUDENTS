-- Add moderation-specific listing status so admin report approval can keep MOD_HIDDEN.
-- This preserves existing statuses while allowing moderation to distinguish hidden listings.

ALTER TABLE listings
    MODIFY status ENUM('DRAFT', 'ACTIVE', 'HIDDEN', 'MOD_HIDDEN', 'SOLD', 'GIVEN_AWAY', 'BANNED', 'DELETED')
    DEFAULT 'DRAFT';
