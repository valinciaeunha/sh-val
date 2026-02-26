-- ============================================
-- ScriptHub.id Database Schema - Executors Module
-- Version: 014
-- Description: Create executors and executor_versions tables
-- ============================================

-- ============================================
-- EXECUTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS executors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    discord VARCHAR(255),
    telegram VARCHAR(255),
    platforms TEXT[] DEFAULT '{}',
    price_model VARCHAR(20) DEFAULT 'Free',
    status VARCHAR(50) DEFAULT 'Pending',
    logo_url TEXT,
    banner_url TEXT,
    tags TEXT[] DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for executors
CREATE INDEX IF NOT EXISTS idx_executors_slug ON executors(slug);
CREATE INDEX IF NOT EXISTS idx_executors_owner_id ON executors(owner_id);
CREATE INDEX IF NOT EXISTS idx_executors_status ON executors(status);

-- Trigger for updated_at
CREATE TRIGGER update_executors_updated_at BEFORE UPDATE ON executors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE executors IS 'Executor listings created by developers/vendors';

-- ============================================
-- EXECUTOR VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS executor_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    executor_id UUID NOT NULL REFERENCES executors(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    download_url TEXT NOT NULL,
    patch_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for executor_versions
CREATE INDEX IF NOT EXISTS idx_executor_versions_executor_id ON executor_versions(executor_id);
CREATE INDEX IF NOT EXISTS idx_executor_versions_created_at ON executor_versions(created_at DESC);

COMMENT ON TABLE executor_versions IS 'Release history and download links for specific executors';
