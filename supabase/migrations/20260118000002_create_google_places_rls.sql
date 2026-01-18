-- Google Places API Integration - Module 12
-- Row Level Security (RLS) policies for Google Places tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE google_places_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_places_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_places_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_places_import_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: google_places_raw
-- Only admins can access raw Google Places data
-- ============================================================================

-- Admins can view all raw places
CREATE POLICY "Admins can view all raw places"
    ON google_places_raw FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can insert raw places
CREATE POLICY "Admins can insert raw places"
    ON google_places_raw FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can update raw places
CREATE POLICY "Admins can update raw places"
    ON google_places_raw FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can delete raw places
CREATE POLICY "Admins can delete raw places"
    ON google_places_raw FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: google_places_photos
-- Only admins can access photo records
-- ============================================================================

CREATE POLICY "Admins can view all photos"
    ON google_places_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert photos"
    ON google_places_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update photos"
    ON google_places_photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete photos"
    ON google_places_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: google_places_reviews
-- Only admins can access review records
-- ============================================================================

CREATE POLICY "Admins can view all reviews"
    ON google_places_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert reviews"
    ON google_places_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update reviews"
    ON google_places_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete reviews"
    ON google_places_reviews FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: google_places_import_candidates
-- Only admins can access import candidates
-- ============================================================================

CREATE POLICY "Admins can view all candidates"
    ON google_places_import_candidates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert candidates"
    ON google_places_import_candidates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update candidates"
    ON google_places_import_candidates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete candidates"
    ON google_places_import_candidates FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: sync_logs
-- Only admins can access sync logs
-- ============================================================================

CREATE POLICY "Admins can view all sync logs"
    ON sync_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert sync logs"
    ON sync_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update sync logs"
    ON sync_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- No delete policy on sync_logs - they should never be deleted for audit purposes
