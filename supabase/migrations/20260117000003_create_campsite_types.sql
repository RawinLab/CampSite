-- Migration: Create campsite_types table
-- Description: Lookup table for campsite types (camping, glamping, etc.)
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS campsite_types (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    color_hex VARCHAR(7) NOT NULL, -- for map markers
    icon VARCHAR(50), -- optional icon name
    description_th TEXT,
    description_en TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campsite_types_slug ON campsite_types(slug);
CREATE INDEX IF NOT EXISTS idx_campsite_types_active ON campsite_types(is_active) WHERE is_active = TRUE;

-- Comment: Campsite types lookup table created
