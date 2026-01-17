-- Migration: Create analytics_events table
-- Description: Track user interactions for analytics dashboard
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID REFERENCES campsites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type event_type NOT NULL,
    metadata JSONB DEFAULT '{}',
    -- Optional tracking fields
    session_id VARCHAR(100),
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    -- Location data (if available)
    country VARCHAR(2),
    city VARCHAR(100),
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_campsite ON analytics_events(campsite_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_campsite_type ON analytics_events(campsite_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata ON analytics_events USING GIN (metadata);

-- Note: Date range queries use idx_analytics_created index
-- DATE() function indexes require IMMUTABLE wrapper, skipped for simplicity

-- Comment: Analytics events table created for tracking user interactions
