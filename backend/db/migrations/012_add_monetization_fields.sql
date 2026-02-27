ALTER TABLE scripts
ADD COLUMN IF NOT EXISTS has_key_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS key_system_url TEXT,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS purchase_url TEXT;

-- Index for filtering paid/free scripts if needed
CREATE INDEX IF NOT EXISTS idx_scripts_is_paid ON scripts(is_paid);
