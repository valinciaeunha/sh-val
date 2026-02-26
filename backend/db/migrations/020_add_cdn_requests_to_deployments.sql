-- ============================================
-- ScriptHub.id Database Schema - Deployments CDN Tracking
-- Version: 020
-- Description: Add cdn_requests counter to deployments
-- ============================================

ALTER TABLE deployments
    ADD COLUMN IF NOT EXISTS cdn_requests BIGINT NOT NULL DEFAULT 0;
