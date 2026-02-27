-- ============================================
-- ScriptHub.id Database Schema - Hubs Module
-- Version: 003
-- Description: Add discord_server column to hubs table
-- ============================================

ALTER TABLE hubs
ADD COLUMN IF NOT EXISTS discord_server VARCHAR(255);

COMMENT ON COLUMN hubs.discord_server IS 'Optional Discord server invite link';
