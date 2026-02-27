-- ============================================
-- ScriptHub.id Database Schema - Games & Tags
-- Version: 007
-- Description: Games categories, tags, and script linking
-- ============================================

-- ============================================
-- GAMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    game_platform_id VARCHAR(100),
    platform VARCHAR(50) DEFAULT 'roblox',
    logo_url TEXT,
    banner_url TEXT,
    slug VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_platform_id ON games(game_platform_id);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE games IS 'Game categories for organizing scripts by game';

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

COMMENT ON TABLE tags IS 'Reusable tags for categorizing scripts';

-- ============================================
-- SCRIPT_TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS script_tags (
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (script_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_script_tags_script ON script_tags(script_id);
CREATE INDEX IF NOT EXISTS idx_script_tags_tag ON script_tags(tag_id);

COMMENT ON TABLE script_tags IS 'Many-to-many relationship between scripts and tags';

-- ============================================
-- ALTER SCRIPTS TABLE — add game_id FK
-- ============================================
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scripts_game_id ON scripts(game_id);
