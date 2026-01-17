-- Migration: Create review_helpful table
-- Description: Track helpful votes (one per user per review)
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS review_helpful (
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON review_helpful(user_id);

-- Comment: Review helpful votes table created
