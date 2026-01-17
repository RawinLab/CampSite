-- Migration: Create review_photos table
-- Description: Photos attached to reviews
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS review_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_sort ON review_photos(review_id, sort_order);

-- Limit photos per review (enforced at application level, but add check constraint for safety)
-- Note: Postgres doesn't support referential constraints for limits, so this is handled in app

-- Comment: Review photos table created
