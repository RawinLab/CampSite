-- Migration: Create campsite_amenities junction table
-- Description: Many-to-many relationship between campsites and amenities
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS campsite_amenities (
    campsite_id UUID REFERENCES campsites(id) ON DELETE CASCADE,
    amenity_id INT REFERENCES amenities(id) ON DELETE CASCADE,
    notes TEXT, -- optional notes about the amenity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (campsite_id, amenity_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_campsite_amenities_campsite ON campsite_amenities(campsite_id);
CREATE INDEX IF NOT EXISTS idx_campsite_amenities_amenity ON campsite_amenities(amenity_id);

-- Comment: Campsite amenities junction table created
