-- Migration: Create campsite_photos table
-- Description: Photo gallery for campsites
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS campsite_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    width INT,
    height INT,
    file_size INT, -- in bytes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campsite_photos_campsite ON campsite_photos(campsite_id);
CREATE INDEX IF NOT EXISTS idx_campsite_photos_primary ON campsite_photos(campsite_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_campsite_photos_sort ON campsite_photos(campsite_id, sort_order);

-- Ensure only one primary photo per campsite (using partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_campsite_photos_single_primary
    ON campsite_photos(campsite_id) WHERE is_primary = TRUE;

-- Comment: Campsite photos table created with primary photo constraint
