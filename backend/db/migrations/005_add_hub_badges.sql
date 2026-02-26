-- ============================================
-- ScriptHub.id Database Schema - Hub Badges
-- Version: 005
-- Description: Add is_official and is_verified columns
-- ============================================

ALTER TABLE hubs
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_hubs_is_official ON hubs(is_official) WHERE is_official = TRUE;
CREATE INDEX IF NOT EXISTS idx_hubs_is_verified ON hubs(is_verified) WHERE is_verified = TRUE;

COMMENT ON COLUMN hubs.is_official IS 'Hub is officially managed by ScriptHub team';
COMMENT ON COLUMN hubs.is_verified IS 'Hub has been verified for authenticity';
