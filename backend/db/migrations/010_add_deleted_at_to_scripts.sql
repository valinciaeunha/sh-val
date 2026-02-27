-- ============================================
-- ScriptHub.id Database Schema - Add soft delete
-- Version: 010
-- Description: Add deleted_at column for soft deletes
-- ============================================

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for filtering non-deleted scripts
CREATE INDEX IF NOT EXISTS idx_scripts_deleted_at ON scripts(deleted_at);
