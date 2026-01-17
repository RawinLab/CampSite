-- Migration: Create RLS policies
-- Description: Row Level Security policies for all tables
-- Date: 2026-01-17

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES
-- ============================================

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Prevent direct insert (handled by trigger)
CREATE POLICY "No direct profile insert"
    ON profiles FOR INSERT
    WITH CHECK (false);

-- Admin can update any profile
CREATE POLICY "Admin can update any profile"
    ON profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- LOOKUP TABLES (Public Read)
-- ============================================

-- Provinces - public read
CREATE POLICY "Provinces are viewable by everyone"
    ON provinces FOR SELECT
    USING (true);

-- Campsite types - public read
CREATE POLICY "Campsite types are viewable by everyone"
    ON campsite_types FOR SELECT
    USING (true);

-- Amenities - public read
CREATE POLICY "Amenities are viewable by everyone"
    ON amenities FOR SELECT
    USING (true);

-- Admin can manage lookup tables
CREATE POLICY "Admin can manage provinces"
    ON provinces FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Admin can manage campsite types"
    ON campsite_types FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Admin can manage amenities"
    ON amenities FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- CAMPSITES
-- ============================================

-- Anyone can view approved and active campsites
CREATE POLICY "Approved campsites are viewable by everyone"
    ON campsites FOR SELECT
    USING (
        (status = 'approved' AND is_active = true)
        OR owner_id = get_current_profile_id()
        OR is_admin()
    );

-- Owners can insert campsites
CREATE POLICY "Owners can insert campsites"
    ON campsites FOR INSERT
    WITH CHECK (
        owner_id = get_current_profile_id()
        AND get_current_user_role() IN ('owner', 'admin')
    );

-- Owners can update their own campsites
CREATE POLICY "Owners can update own campsites"
    ON campsites FOR UPDATE
    USING (
        owner_id = get_current_profile_id()
        OR is_admin()
    )
    WITH CHECK (
        owner_id = get_current_profile_id()
        OR is_admin()
    );

-- Only admin can delete campsites
CREATE POLICY "Admin can delete campsites"
    ON campsites FOR DELETE
    USING (is_admin());

-- ============================================
-- CAMPSITE AMENITIES
-- ============================================

-- Public read for approved campsites
CREATE POLICY "Campsite amenities viewable for approved campsites"
    ON campsite_amenities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_amenities.campsite_id
            AND (status = 'approved' OR owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- Owners can manage their campsite amenities
CREATE POLICY "Owners can manage campsite amenities"
    ON campsite_amenities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_amenities.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_amenities.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- ============================================
-- ACCOMMODATION TYPES
-- ============================================

-- Public read for approved campsites
CREATE POLICY "Accommodation types viewable for approved campsites"
    ON accommodation_types FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = accommodation_types.campsite_id
            AND (status = 'approved' OR owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- Owners can manage their accommodation types
CREATE POLICY "Owners can manage accommodation types"
    ON accommodation_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = accommodation_types.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = accommodation_types.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- ============================================
-- CAMPSITE PHOTOS
-- ============================================

-- Public read for approved campsites
CREATE POLICY "Campsite photos viewable for approved campsites"
    ON campsite_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_photos.campsite_id
            AND (status = 'approved' OR owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- Owners can manage their campsite photos
CREATE POLICY "Owners can manage campsite photos"
    ON campsite_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_photos.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = campsite_photos.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- ============================================
-- REVIEWS
-- ============================================

-- Anyone can view non-hidden reviews
CREATE POLICY "Non-hidden reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (
        is_hidden = false
        OR user_id = get_current_profile_id()
        OR is_admin()
    );

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        user_id = get_current_profile_id()
        AND auth.uid() IS NOT NULL
    );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON reviews FOR UPDATE
    USING (
        user_id = get_current_profile_id()
        OR is_admin()
    )
    WITH CHECK (
        user_id = get_current_profile_id()
        OR is_admin()
    );

-- Only admin can delete reviews
CREATE POLICY "Admin can delete reviews"
    ON reviews FOR DELETE
    USING (is_admin());

-- ============================================
-- REVIEW PHOTOS
-- ============================================

-- Public read for non-hidden reviews
CREATE POLICY "Review photos viewable for non-hidden reviews"
    ON review_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_photos.review_id
            AND is_hidden = false
        )
        OR is_admin()
    );

-- Users can manage their review photos
CREATE POLICY "Users can manage their review photos"
    ON review_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_photos.review_id
            AND user_id = get_current_profile_id()
        )
        OR is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_photos.review_id
            AND user_id = get_current_profile_id()
        )
        OR is_admin()
    );

-- ============================================
-- REVIEW HELPFUL
-- ============================================

-- Anyone can see helpful counts (via reviews)
CREATE POLICY "Review helpful visible via reviews"
    ON review_helpful FOR SELECT
    USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote helpful"
    ON review_helpful FOR INSERT
    WITH CHECK (
        user_id = get_current_profile_id()
        AND auth.uid() IS NOT NULL
    );

-- Users can remove their own votes
CREATE POLICY "Users can remove own helpful vote"
    ON review_helpful FOR DELETE
    USING (user_id = get_current_profile_id());

-- ============================================
-- WISHLISTS
-- ============================================

-- Users can only see their own wishlist
CREATE POLICY "Users can view own wishlist"
    ON wishlists FOR SELECT
    USING (user_id = get_current_profile_id());

-- Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist"
    ON wishlists FOR INSERT
    WITH CHECK (user_id = get_current_profile_id());

CREATE POLICY "Users can delete from own wishlist"
    ON wishlists FOR DELETE
    USING (user_id = get_current_profile_id());

-- ============================================
-- INQUIRIES
-- ============================================

-- Users can see their own inquiries, owners can see inquiries for their campsites
CREATE POLICY "Users can view relevant inquiries"
    ON inquiries FOR SELECT
    USING (
        user_id = get_current_profile_id()
        OR EXISTS (
            SELECT 1 FROM campsites
            WHERE id = inquiries.campsite_id
            AND owner_id = get_current_profile_id()
        )
        OR is_admin()
    );

-- Anyone can send inquiries
CREATE POLICY "Anyone can send inquiries"
    ON inquiries FOR INSERT
    WITH CHECK (true);

-- Owners can update inquiries for their campsites (to reply)
CREATE POLICY "Owners can update inquiries for their campsites"
    ON inquiries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = inquiries.campsite_id
            AND owner_id = get_current_profile_id()
        )
        OR is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = inquiries.campsite_id
            AND owner_id = get_current_profile_id()
        )
        OR is_admin()
    );

-- ============================================
-- NEARBY ATTRACTIONS
-- ============================================

-- Public read for approved campsites
CREATE POLICY "Nearby attractions viewable for approved campsites"
    ON nearby_attractions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = nearby_attractions.campsite_id
            AND (status = 'approved' OR owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- Owners can manage nearby attractions
CREATE POLICY "Owners can manage nearby attractions"
    ON nearby_attractions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = nearby_attractions.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = nearby_attractions.campsite_id
            AND (owner_id = get_current_profile_id() OR is_admin())
        )
    );

-- ============================================
-- ANALYTICS EVENTS
-- ============================================

-- Owners can see analytics for their campsites
CREATE POLICY "Owners can view their analytics"
    ON analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campsites
            WHERE id = analytics_events.campsite_id
            AND owner_id = get_current_profile_id()
        )
        OR is_admin()
    );

-- Anyone can insert analytics events
CREATE POLICY "Anyone can create analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (true);

-- ============================================
-- OWNER REQUESTS
-- ============================================

-- Users can see their own requests
CREATE POLICY "Users can view own owner requests"
    ON owner_requests FOR SELECT
    USING (
        user_id = get_current_profile_id()
        OR is_admin()
    );

-- Users can create owner requests
CREATE POLICY "Users can create owner requests"
    ON owner_requests FOR INSERT
    WITH CHECK (user_id = get_current_profile_id());

-- Only admin can update owner requests
CREATE POLICY "Admin can update owner requests"
    ON owner_requests FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Comment: All RLS policies created
