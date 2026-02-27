-- ============================================
-- ScriptHub.id Database Schema - User Plans & Credits
-- Version: 017
-- Description: Add user plans and credit tracking tables
-- ============================================

-- Plan type enum
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- USER_PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL DEFAULT 'free',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER_CREDITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    obfuscation_credits INT NOT NULL DEFAULT 0,
    key_credits INT NOT NULL DEFAULT 0,
    deployment_credits INT NOT NULL DEFAULT 3,
    credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_type ON user_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
