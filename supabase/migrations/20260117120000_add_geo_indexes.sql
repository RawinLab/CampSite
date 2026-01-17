-- Migration: Add geo-spatial indexing to campsites table
-- Description: Enables PostGIS extension and adds spatial indexes for location-based queries
-- Date: 2026-01-17
-- Task: T008 - Add geo-spatial indexing to database

-- Enable PostGIS extension for geo-spatial functionality
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Add a geometry column for spatial operations
-- This stores the point as a proper geometry type for efficient spatial queries
ALTER TABLE campsites
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Populate the geography column from existing lat/lng values
UPDATE campsites
SET location = ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create spatial index (GIST) on the geography column for efficient bounding box queries
-- This optimizes: ST_DWithin, ST_Distance, and bounding box operations
CREATE INDEX IF NOT EXISTS idx_campsites_location_gist
ON campsites USING GIST (location);

-- Create compound index for common query patterns (status + location)
-- Useful for queries like "approved campsites within X km"
CREATE INDEX IF NOT EXISTS idx_campsites_approved_location
ON campsites USING GIST (location)
WHERE status = 'approved' AND is_active = TRUE;

-- Create B-tree index on lat/lng for simple range queries (bounding box without PostGIS)
-- This serves as a fallback for simple rectangular bounding box queries
CREATE INDEX IF NOT EXISTS idx_campsites_lat_lng
ON campsites (latitude, longitude);

-- Create function to keep location column in sync with lat/lng updates
CREATE OR REPLACE FUNCTION update_campsite_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update location on insert/update
DROP TRIGGER IF EXISTS trigger_update_campsite_location ON campsites;
CREATE TRIGGER trigger_update_campsite_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON campsites
FOR EACH ROW
EXECUTE FUNCTION update_campsite_location();

-- Comment: Geo-spatial indexing added for efficient location-based campsite searches
