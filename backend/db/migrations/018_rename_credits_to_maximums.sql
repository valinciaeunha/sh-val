-- ============================================
-- ScriptHub.id Database Schema - Rename Credits to Maximums
-- Version: 018
-- ============================================

-- 1. Rename table
ALTER TABLE user_credits RENAME TO user_maximums;

-- 2. Rename columns
ALTER TABLE user_maximums RENAME COLUMN obfuscation_credits TO maximum_obfuscation;
ALTER TABLE user_maximums RENAME COLUMN key_credits TO maximum_keys;
ALTER TABLE user_maximums RENAME COLUMN deployment_credits TO maximum_deployments;
ALTER TABLE user_maximums RENAME COLUMN credits_reset_at TO maximums_reset_at;

-- 3. Rename indexes 
ALTER INDEX IF EXISTS idx_user_credits_user_id RENAME TO idx_user_maximums_user_id;

-- 4. Rename trigger
ALTER TRIGGER update_user_credits_updated_at ON user_maximums RENAME TO update_user_maximums_updated_at;
