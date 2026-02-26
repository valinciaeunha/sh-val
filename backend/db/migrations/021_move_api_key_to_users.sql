-- ============================================
-- ScriptHub.id Database Schema - Move API Key to Users
-- Version: 021
-- Description: Add api_key column to users table, migrate data, and drop from key_settings
-- ============================================

-- 1. Add the column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;

-- 2. Migrate existing API keys from key_settings to users
-- Only move keys where the user actually has one set
UPDATE users u
SET api_key = ks.api_key
FROM key_settings ks
WHERE u.id = ks.user_id AND ks.api_key IS NOT NULL;

-- 3. Drop the old column from key_settings
ALTER TABLE key_settings DROP COLUMN IF EXISTS api_key;
