-- Google Places API Integration - Module 12
-- Create tables for storing raw Google Places data, photos, reviews, import candidates, and sync logs

-- ============================================================================
-- TABLE: google_places_raw
-- Stores raw JSON responses from Google Places API
-- ============================================================================
CREATE TABLE google_places_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Google Places identifiers
    place_id TEXT NOT NULL UNIQUE, -- Google's place_id (unique identifier)
    place_hash TEXT UNIQUE, -- MD5 hash of name+address for deduplication

    -- Raw API response (full Place Details response as JSONB)
    raw_data JSONB NOT NULL,
    data_fetched_at TIMESTAMPTZ DEFAULT NOW(),

    -- Processing status
    sync_status sync_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,

    -- Import tracking
    is_imported BOOLEAN DEFAULT FALSE,
    imported_to_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,
    imported_at TIMESTAMPTZ,

    -- Quality indicators (denormalized for easier querying)
    has_photos BOOLEAN DEFAULT FALSE,
    photo_count INT DEFAULT 0,
    has_reviews BOOLEAN DEFAULT FALSE,
    review_count INT DEFAULT 0,
    rating DECIMAL(2,1), -- Google's rating (1-5)

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for google_places_raw
CREATE INDEX idx_google_places_raw_place_id ON google_places_raw(place_id);
CREATE INDEX idx_google_places_raw_place_hash ON google_places_raw(place_hash) WHERE place_hash IS NOT NULL;
CREATE INDEX idx_google_places_raw_status ON google_places_raw(sync_status);
CREATE INDEX idx_google_places_raw_imported ON google_places_raw(is_imported) WHERE is_imported = FALSE;
CREATE INDEX idx_google_places_raw_rating ON google_places_raw(rating DESC) WHERE rating IS NOT NULL;

-- Optional: PostGIS/earthdistance index for location-based queries
-- Requires: CREATE EXTENSION cube; CREATE EXTENSION earthdistance;
-- Uncomment if needed for advanced location searches
-- CREATE INDEX idx_google_places_raw_location ON google_places_raw
--     USING GIST (
--         ll_to_earth(
--             (raw_data->'geometry'->'location'->>'lat')::decimal,
--             (raw_data->'geometry'->'location'->>'lng')::decimal
--         )
--     );

-- Comments
COMMENT ON TABLE google_places_raw IS 'Raw Google Places API data for camping sites in Thailand';
COMMENT ON COLUMN google_places_raw.place_id IS 'Google Places unique identifier';
COMMENT ON COLUMN google_places_raw.place_hash IS 'MD5 hash of name+address for deduplication';
COMMENT ON COLUMN google_places_raw.raw_data IS 'Full Google Place Details response as JSONB';
COMMENT ON COLUMN google_places_raw.is_imported IS 'Whether this place has been imported as a campsite';

-- ============================================================================
-- TABLE: google_places_photos
-- Stores photo references and local storage URLs
-- ============================================================================
CREATE TABLE google_places_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT NOT NULL REFERENCES google_places_raw(place_id) ON DELETE CASCADE,

    -- Google Places photo info
    photo_reference TEXT NOT NULL,
    width INT,
    height INT,

    -- Local storage info (Supabase Storage)
    storage_path TEXT, -- Path in Supabase Storage bucket
    original_url TEXT, -- Public URL for original photo
    thumbnail_url TEXT, -- Public URL for thumbnail

    -- Processing status
    download_status sync_status DEFAULT 'pending',
    downloaded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for google_places_photos
CREATE INDEX idx_google_places_photos_place_id ON google_places_photos(google_place_id);
CREATE INDEX idx_google_places_photos_status ON google_places_photos(download_status);
CREATE INDEX idx_google_places_photos_storage_path ON google_places_photos(storage_path) WHERE storage_path IS NOT NULL;

-- Comments
COMMENT ON TABLE google_places_photos IS 'Photo data from Google Places API with local storage URLs';
COMMENT ON COLUMN google_places_photos.photo_reference IS 'Google Places photo reference for downloading';

-- ============================================================================
-- TABLE: google_places_reviews
-- Stores raw review data from Google Places (NOT imported as user reviews)
-- ============================================================================
CREATE TABLE google_places_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT NOT NULL REFERENCES google_places_raw(place_id) ON DELETE CASCADE,

    -- Raw review data (full Google review object as JSONB)
    raw_data JSONB NOT NULL,

    -- Denormalized fields for easier querying
    author_name TEXT,
    author_profile_url TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    text_content TEXT,
    relative_time_description TEXT,
    reviewed_at TIMESTAMPTZ,

    -- Processing flag (never imported as user reviews, just for display)
    is_imported BOOLEAN DEFAULT FALSE,
    imported_to_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for google_places_reviews
CREATE INDEX idx_google_places_reviews_place_id ON google_places_reviews(google_place_id);
CREATE INDEX idx_google_places_reviews_imported ON google_places_reviews(is_imported) WHERE is_imported = TRUE;
CREATE INDEX idx_google_places_reviews_rating ON google_places_reviews(rating);

-- Comments
COMMENT ON TABLE google_places_reviews IS 'Google Places review data (stored raw, never imported as user reviews)';
COMMENT ON COLUMN google_places_reviews.is_imported IS 'Reviews are never imported as user reviews, only stored for display';

-- ============================================================================
-- TABLE: google_places_import_candidates
-- AI-processed candidates ready for admin review and import
-- ============================================================================
CREATE TABLE google_places_import_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_raw_id UUID NOT NULL REFERENCES google_places_raw(id) ON DELETE CASCADE,

    -- AI processing results
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,

    -- Mapped data (from AI processing - campsite-ready structure)
    processed_data JSONB NOT NULL,

    -- AI suggestions
    suggested_province_id INT REFERENCES provinces(id),
    suggested_type_id INT REFERENCES campsite_types(id),
    suggested_status campsite_status DEFAULT 'pending',

    -- Validation & warnings
    validation_warnings JSONB DEFAULT '[]', -- Array of warning messages
    missing_fields TEXT[] DEFAULT '{}', -- Array of missing required fields

    -- Import status
    status import_candidate_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    imported_to_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,
    imported_at TIMESTAMPTZ,

    -- Admin notes
    admin_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for google_places_import_candidates
CREATE INDEX idx_google_places_candidates_status ON google_places_import_candidates(status);
CREATE INDEX idx_google_places_candidates_confidence ON google_places_import_candidates(confidence_score DESC);
CREATE INDEX idx_google_places_candidates_duplicate ON google_places_import_candidates(is_duplicate) WHERE is_duplicate = TRUE;
CREATE INDEX idx_google_places_candidates_province ON google_places_import_candidates(suggested_province_id);
CREATE INDEX idx_google_places_candidates_reviewed_by ON google_places_import_candidates(reviewed_by);

-- Comments
COMMENT ON TABLE google_places_import_candidates IS 'AI-processed candidates ready for admin review and import';
COMMENT ON COLUMN google_places_import_candidates.confidence_score IS 'AI confidence score (0-1) for data quality';
COMMENT ON COLUMN google_places_import_candidates.is_duplicate IS 'Whether AI detected this is a duplicate of existing campsite';
COMMENT ON COLUMN google_places_import_candidates.processed_data IS 'Campsite-ready data structure from AI processing';

-- ============================================================================
-- TABLE: sync_logs
-- Track Google Places sync execution history
-- ============================================================================
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Execution info
    sync_type TEXT NOT NULL DEFAULT 'google_places', -- 'google_places', 'full', 'incremental'
    triggered_by TEXT DEFAULT 'system', -- 'system', 'admin', 'api'

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INT,

    -- Status
    status sync_status NOT NULL DEFAULT 'processing',

    -- Statistics
    places_found INT DEFAULT 0,
    places_updated INT DEFAULT 0,
    photos_downloaded INT DEFAULT 0,
    reviews_fetched INT DEFAULT 0,
    api_requests_made INT DEFAULT 0,

    -- Cost tracking
    estimated_cost_usd DECIMAL(10,2),

    -- Error tracking
    error_message TEXT,
    error_details JSONB,

    -- Configuration snapshot (search queries, options used)
    config_snapshot JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync_logs
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_triggered_by ON sync_logs(triggered_by);

-- Comments
COMMENT ON TABLE sync_logs IS 'Google Places sync execution history and statistics';
COMMENT ON COLUMN sync_logs.sync_type IS 'Type of sync: google_places, full, or incremental';
COMMENT ON COLUMN sync_logs.estimated_cost_usd IS 'Estimated API cost in USD based on requests made';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_google_places_raw_updated_at
    BEFORE UPDATE ON google_places_raw
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_google_places_candidates_updated_at
    BEFORE UPDATE ON google_places_import_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
