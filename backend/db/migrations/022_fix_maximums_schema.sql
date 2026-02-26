-- ============================================
-- ScriptHub.id Database Schema - Fix Maximums Schema
-- Version: 022
-- Description: Add missing column and enum value
-- ============================================

-- Add missing column for device limits per key
ALTER TABLE user_maximums ADD COLUMN IF NOT EXISTS maximum_devices_per_key INTEGER NOT NULL DEFAULT 1;

-- Add 'custom' to plan_type enum (safe, skips if already exists)
DO $$ BEGIN
    ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
