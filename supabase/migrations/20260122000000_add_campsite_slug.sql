-- Add slug column to campsites table for SEO-friendly URLs
-- Migration: 20260122000000_add_campsite_slug.sql

-- Add slug column
ALTER TABLE campsites ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique index on slug (allowing null for existing records initially)
CREATE UNIQUE INDEX IF NOT EXISTS idx_campsites_slug ON campsites(slug) WHERE slug IS NOT NULL;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_campsite_slug(campsite_name TEXT, campsite_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special characters
    base_slug := lower(regexp_replace(
        regexp_replace(campsite_name, '[^\w\s\u0E00-\u0E7F-]', '', 'g'),  -- Keep Thai characters
        '\s+', '-', 'g'
    ));

    -- Remove leading/trailing hyphens
    base_slug := trim(both '-' from base_slug);

    -- If empty, use part of UUID
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := substring(campsite_id::text, 1, 8);
    END IF;

    -- Truncate to reasonable length
    base_slug := substring(base_slug, 1, 200);

    final_slug := base_slug;

    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM campsites WHERE slug = final_slug AND id != campsite_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing campsites
UPDATE campsites
SET slug = generate_campsite_slug(name, id)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE campsites ALTER COLUMN slug SET NOT NULL;

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION trigger_generate_campsite_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_campsite_slug(NEW.name, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS campsite_slug_trigger ON campsites;

-- Create trigger
CREATE TRIGGER campsite_slug_trigger
    BEFORE INSERT ON campsites
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_campsite_slug();

-- Add comment
COMMENT ON COLUMN campsites.slug IS 'SEO-friendly URL slug generated from campsite name';
