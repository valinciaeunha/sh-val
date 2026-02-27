-- ============================================
-- ScriptHub.id Database Schema - Interactions
-- Version: 011
-- Description: Tables for script views, likes, and comments
-- ============================================

-- ============================================
-- SCRIPT_VIEWS TABLE
-- Stores unique views per IP per Script
-- ============================================
CREATE TABLE IF NOT EXISTS script_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    ip_address INET NOT NULL, -- IPv4 or IPv6
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(script_id, ip_address) -- Ensures 1 view per IP per Script
);

CREATE INDEX IF NOT EXISTS idx_script_views_script_id ON script_views(script_id);
CREATE INDEX IF NOT EXISTS idx_script_views_ip_address ON script_views(ip_address);
CREATE INDEX IF NOT EXISTS idx_script_views_viewed_at ON script_views(viewed_at);

-- ============================================
-- SCRIPT_LIKES TABLE
-- Stores user likes on scripts
-- ============================================
CREATE TABLE IF NOT EXISTS script_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(script_id, user_id) -- Ensures 1 like per User per Script
);

CREATE INDEX IF NOT EXISTS idx_script_likes_script_id ON script_likes(script_id);
CREATE INDEX IF NOT EXISTS idx_script_likes_user_id ON script_likes(user_id);

-- ============================================
-- SCRIPT_COMMENTS TABLE
-- Stores user comments on scripts
-- ============================================
CREATE TABLE IF NOT EXISTS script_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES script_comments(id) ON DELETE CASCADE, -- For nested replies
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_script_comments_script_id ON script_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_user_id ON script_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_parent_id ON script_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_created_at ON script_comments(created_at);

-- Trigger to update updated_at for comments
CREATE TRIGGER update_script_comments_updated_at BEFORE UPDATE ON script_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
