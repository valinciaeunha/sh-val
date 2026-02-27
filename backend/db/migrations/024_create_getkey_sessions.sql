-- ============================================
-- ScriptHub.id Database Schema - Get Key Sessions
-- Version: 024
-- Description: Create getkey_sessions table for anti-bypass protection
-- ============================================

CREATE TABLE IF NOT EXISTS getkey_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    checkpoints_required INT NOT NULL DEFAULT 0,
    checkpoints_completed INT[] DEFAULT '{}',
    captcha_required BOOLEAN NOT NULL DEFAULT false,
    captcha_answer INT,
    captcha_passed BOOLEAN NOT NULL DEFAULT false,
    key_value TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT max_checkpoints CHECK (array_length(checkpoints_completed, 1) <= checkpoints_required)
);

-- Index for quick token lookups
CREATE INDEX IF NOT EXISTS getkey_sessions_token_idx ON getkey_sessions(token);
-- Index for rate-limiting start-session per IP
CREATE INDEX IF NOT EXISTS getkey_sessions_ip_idx ON getkey_sessions(ip_address, created_at);
-- Index to clean up old sessions
CREATE INDEX IF NOT EXISTS getkey_sessions_expires_idx ON getkey_sessions(expires_at);

-- Comments
COMMENT ON TABLE getkey_sessions IS 'Tracks state of user progress through the Get Key flow';
COMMENT ON COLUMN getkey_sessions.token IS 'HMAC signed token tied to this session';
COMMENT ON COLUMN getkey_sessions.checkpoints_completed IS 'Array of completed checkpoint indices';
COMMENT ON COLUMN getkey_sessions.captcha_answer IS 'Server-generated expected captcha answer';
