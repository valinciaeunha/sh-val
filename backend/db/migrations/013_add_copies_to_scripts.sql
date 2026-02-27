-- Migration: 013_add_copies_to_scripts
-- Description: Add copies counter to track loader copy events

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS copies INTEGER DEFAULT 0;

COMMENT ON COLUMN scripts.copies IS 'Number of times the loader script has been copied';
