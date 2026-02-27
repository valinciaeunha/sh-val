-- ============================================
-- ScriptHub.id Database Schema - Hubs Enum
-- Version: 004
-- Description: Convert status column to ENUM type
-- ============================================

-- Create the ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE hub_status AS ENUM ('active', 'pending', 'suspended', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the old check constraint and default value
ALTER TABLE hubs DROP CONSTRAINT IF EXISTS hubs_status_check;
ALTER TABLE hubs ALTER COLUMN status DROP DEFAULT;

-- Convert the column to use the new ENUM type
-- We use a USING clause to handle the conversion from VARCHAR to hub_status
ALTER TABLE hubs 
    ALTER COLUMN status TYPE hub_status 
    USING status::hub_status;

-- Set the default value safely
ALTER TABLE hubs 
    ALTER COLUMN status SET DEFAULT 'pending'::hub_status;
