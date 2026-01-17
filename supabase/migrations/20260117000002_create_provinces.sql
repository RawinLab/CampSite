-- Migration: Create provinces table
-- Description: 77 Thai provinces for location search
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    region VARCHAR(50) -- north, south, central, east, northeast
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_provinces_slug ON provinces(slug);
CREATE INDEX IF NOT EXISTS idx_provinces_name_th ON provinces(name_th);
CREATE INDEX IF NOT EXISTS idx_provinces_name_en ON provinces(name_en);
CREATE INDEX IF NOT EXISTS idx_provinces_region ON provinces(region);

-- Comment: Province table created for Thai location data
