-- ============================================
-- ScriptHub.id Database Schema - Get Key System (Per-User)
-- Version: 023
-- Description: Add Get Key ad system columns to existing key_settings table
-- ============================================

ALTER TABLE key_settings
    ADD COLUMN IF NOT EXISTS getkey_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS checkpoint_count INT NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS ad_links TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS checkpoint_timer_seconds INT NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS key_duration_hours INT NOT NULL DEFAULT 24,
    ADD COLUMN IF NOT EXISTS max_keys_per_ip INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS cooldown_hours INT NOT NULL DEFAULT 24;

COMMENT ON COLUMN key_settings.getkey_enabled IS 'Master toggle for Get Key ad system';
COMMENT ON COLUMN key_settings.checkpoint_count IS 'Number of ad checkpoint buttons users must click';
COMMENT ON COLUMN key_settings.ad_links IS 'Array of Adsterra Direct Link URLs';
COMMENT ON COLUMN key_settings.checkpoint_timer_seconds IS 'Countdown seconds per checkpoint button';
COMMENT ON COLUMN key_settings.captcha_enabled IS 'Show math captcha for human verification';
COMMENT ON COLUMN key_settings.key_duration_hours IS 'Auto-expire duration for generated keys in hours';
COMMENT ON COLUMN key_settings.max_keys_per_ip IS 'Max keys per IP per script per cooldown period';
COMMENT ON COLUMN key_settings.cooldown_hours IS 'Hours before same IP can request new key';
