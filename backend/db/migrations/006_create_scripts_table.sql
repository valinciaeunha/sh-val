-- ============================================
-- ScriptHub.id Database Schema - Scripts Module
-- Version: 006
-- Description: Scripts table for user-uploaded scripts
-- ============================================

-- ============================================
-- SCRIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    loader_url TEXT,
    hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'under_review')),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_scripts_slug ON scripts(slug);
CREATE INDEX IF NOT EXISTS idx_scripts_owner_id ON scripts(owner_id);
CREATE INDEX IF NOT EXISTS idx_scripts_hub_id ON scripts(hub_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE scripts IS 'User-uploaded scripts with metadata, views, and likes';
