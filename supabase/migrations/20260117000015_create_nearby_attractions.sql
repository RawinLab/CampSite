-- Migration: Create nearby_attractions table
-- Description: Points of interest near campsites
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS nearby_attractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    distance_km DECIMAL(5, 1) NOT NULL,
    category attraction_category NOT NULL,
    difficulty difficulty_level,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    google_maps_url TEXT,
    image_url TEXT,
    estimated_time VARCHAR(50), -- e.g., "2 hours"
    best_season VARCHAR(100), -- e.g., "November - February"
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nearby_attractions_campsite ON nearby_attractions(campsite_id);
CREATE INDEX IF NOT EXISTS idx_nearby_attractions_category ON nearby_attractions(category);
CREATE INDEX IF NOT EXISTS idx_nearby_attractions_distance ON nearby_attractions(distance_km);
CREATE INDEX IF NOT EXISTS idx_nearby_attractions_active ON nearby_attractions(is_active) WHERE is_active = TRUE;

-- Comment: Nearby attractions table created
