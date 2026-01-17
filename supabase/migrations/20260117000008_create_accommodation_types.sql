-- Migration: Create accommodation_types table
-- Description: Different accommodation options within a campsite
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS accommodation_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INT NOT NULL DEFAULT 2,
    quantity INT DEFAULT 1, -- number of this type available
    price_per_night INT NOT NULL,
    price_weekend INT, -- optional weekend price
    amenities_included TEXT[], -- array of amenity slugs
    dimensions VARCHAR(50), -- e.g., "3m x 3m"
    bed_type VARCHAR(50), -- e.g., "king", "twin"
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accommodation_types_campsite ON accommodation_types(campsite_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_types_active ON accommodation_types(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_accommodation_types_price ON accommodation_types(price_per_night);

-- Comment: Accommodation types table created
