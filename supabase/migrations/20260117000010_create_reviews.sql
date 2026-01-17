-- Migration: Create reviews table
-- Description: User reviews for campsites (auto-approved with report system)
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Ratings (1-5)
    rating_overall INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_cleanliness INT CHECK (rating_cleanliness BETWEEN 1 AND 5),
    rating_staff INT CHECK (rating_staff BETWEEN 1 AND 5),
    rating_facilities INT CHECK (rating_facilities BETWEEN 1 AND 5),
    rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
    rating_location INT CHECK (rating_location BETWEEN 1 AND 5),

    -- Content
    reviewer_type reviewer_type NOT NULL,
    title VARCHAR(100),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 2000),
    pros TEXT,
    cons TEXT,

    -- Engagement
    helpful_count INT DEFAULT 0,

    -- Report-based Moderation (Q11: auto-approve, report to remove)
    is_reported BOOLEAN DEFAULT FALSE,
    report_count INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_reason TEXT,
    hidden_at TIMESTAMPTZ,
    hidden_by UUID REFERENCES profiles(id),

    -- Owner response
    owner_response TEXT,
    owner_response_at TIMESTAMPTZ,

    -- Dates
    visited_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate reviews per user per campsite
    UNIQUE (campsite_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_campsite ON reviews(campsite_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating_overall DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reported ON reviews(is_reported) WHERE is_reported = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON reviews(is_hidden) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(helpful_count DESC);

-- Comment: Reviews table created with report-based moderation
