-- Migration: Create database triggers
-- Description: Automatic triggers for maintaining data integrity
-- Date: 2026-01-17

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON campsites;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON campsites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON accommodation_types;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accommodation_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON reviews;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON inquiries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON nearby_attractions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON nearby_attractions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON owner_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON owner_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RATING CALCULATION TRIGGER
-- ============================================

-- Update campsite rating when reviews change
CREATE OR REPLACE FUNCTION update_campsite_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_campsite_id UUID;
BEGIN
    -- Get the campsite_id from either NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        target_campsite_id := OLD.campsite_id;
    ELSE
        target_campsite_id := NEW.campsite_id;
    END IF;

    -- Update the campsite's rating and review count
    UPDATE campsites SET
        rating_average = (
            SELECT COALESCE(ROUND(AVG(rating_overall)::numeric, 1), 0)
            FROM reviews
            WHERE campsite_id = target_campsite_id AND is_hidden = FALSE
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE campsite_id = target_campsite_id AND is_hidden = FALSE
        ),
        updated_at = NOW()
    WHERE id = target_campsite_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on review INSERT, UPDATE (is_hidden), DELETE
DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_campsite_rating();

DROP TRIGGER IF EXISTS on_review_update ON reviews;
CREATE TRIGGER on_review_update
    AFTER UPDATE OF is_hidden, rating_overall ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_campsite_rating();

DROP TRIGGER IF EXISTS on_review_delete ON reviews;
CREATE TRIGGER on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_campsite_rating();

-- ============================================
-- HELPFUL COUNT TRIGGER
-- ============================================

-- Update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_helpful_insert ON review_helpful;
CREATE TRIGGER on_helpful_insert
    AFTER INSERT ON review_helpful
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

DROP TRIGGER IF EXISTS on_helpful_delete ON review_helpful;
CREATE TRIGGER on_helpful_delete
    AFTER DELETE ON review_helpful
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- ============================================
-- OWNER REQUEST APPROVAL TRIGGER
-- ============================================

-- Upgrade user role when owner request is approved
CREATE OR REPLACE FUNCTION on_owner_request_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Update user's role to owner
        UPDATE profiles
        SET
            role = 'owner',
            business_name = NEW.business_name,
            business_registration = NEW.business_registration,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_owner_request_status_change ON owner_requests;
CREATE TRIGGER on_owner_request_status_change
    AFTER UPDATE OF status ON owner_requests
    FOR EACH ROW
    EXECUTE FUNCTION on_owner_request_approved();

-- ============================================
-- CAMPSITE APPROVAL TRIGGER
-- ============================================

-- Track campsite approval
CREATE OR REPLACE FUNCTION on_campsite_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        NEW.approved_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_campsite_status_change ON campsites;
CREATE TRIGGER on_campsite_status_change
    BEFORE UPDATE OF status ON campsites
    FOR EACH ROW
    EXECUTE FUNCTION on_campsite_approved();

-- ============================================
-- INQUIRY READ TRIGGER
-- ============================================

-- Track when inquiry is first read by owner
CREATE OR REPLACE FUNCTION on_inquiry_read()
RETURNS TRIGGER AS $$
BEGIN
    -- Set read_at only on first read (when transitioning from null)
    IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
        -- Keep the read_at value
        RETURN NEW;
    ELSIF OLD.read_at IS NOT NULL THEN
        -- Preserve original read_at
        NEW.read_at = OLD.read_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_inquiry_read_change ON inquiries;
CREATE TRIGGER on_inquiry_read_change
    BEFORE UPDATE OF read_at ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION on_inquiry_read();

-- Comment: All database triggers created
