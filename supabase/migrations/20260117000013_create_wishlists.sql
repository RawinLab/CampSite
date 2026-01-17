-- Migration: Create wishlists table
-- Description: User saved campsites
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    notes TEXT, -- optional user notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, campsite_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_campsite ON wishlists(campsite_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_created ON wishlists(created_at DESC);

-- Comment: Wishlists table created for saved campsites
