-- Migration: Create moderation_logs table
-- Description: Track all admin moderation actions for audit trail
-- Date: 2026-01-17
-- Module: Admin Dashboard (Module 10)

-- Create action_type enum if not exists
DO $$ BEGIN
    CREATE TYPE moderation_action_type AS ENUM (
        'campsite_approve',
        'campsite_reject',
        'owner_approve',
        'owner_reject',
        'review_hide',
        'review_unhide',
        'review_delete',
        'review_dismiss'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create entity_type enum if not exists
DO $$ BEGIN
    CREATE TYPE moderation_entity_type AS ENUM (
        'campsite',
        'owner_request',
        'review'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    action_type moderation_action_type NOT NULL,
    entity_type moderation_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_entity ON moderation_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "Admins can view moderation logs" ON moderation_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can insert moderation logs (through backend)
CREATE POLICY "Admins can insert moderation logs" ON moderation_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid() AND role = 'admin'
        )
    );

-- Comment: Moderation logs for admin audit trail
