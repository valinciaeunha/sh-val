-- ============================================
-- ScriptHub.id Database Schema - Add API Key to Key Settings
-- Version: 016
-- Description: Add api_key column to key_settings table
-- ============================================

ALTER TABLE key_settings ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;
