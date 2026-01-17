-- Migration: Create amenities table
-- Description: Master list of amenities for campsites
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50) NOT NULL, -- icon name (e.g., 'wifi', 'snowflake')
    category VARCHAR(50), -- grouping: basic, comfort, activities, etc.
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amenities_slug ON amenities(slug);
CREATE INDEX IF NOT EXISTS idx_amenities_category ON amenities(category);
CREATE INDEX IF NOT EXISTS idx_amenities_active ON amenities(is_active) WHERE is_active = TRUE;

-- Comment: Amenities master list created
