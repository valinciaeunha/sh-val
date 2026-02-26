-- ============================================
-- ScriptHub.id Database Schema - Hubs Module
-- Version: 002
-- Description: Hubs table for organizing scripts
-- ============================================

-- ============================================
-- HUBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    logo_url TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hubs_slug ON hubs(slug);
CREATE INDEX IF NOT EXISTS idx_hubs_owner_id ON hubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_hubs_status ON hubs(status);
CREATE INDEX IF NOT EXISTS idx_hubs_created_at ON hubs(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON hubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE hubs IS 'Collections of scripts managed by a user (vendor)';
