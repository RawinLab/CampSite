-- Migration: Create review_reports table
-- Description: Track user reports on reviews for moderation (Q11: report-based moderation)
-- Date: 2026-01-17

-- Create report_reason enum type if not exists
DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'fake', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create review_reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate reports from same user on same review
    UNIQUE (review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_user ON review_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reason ON review_reports(reason);
CREATE INDEX IF NOT EXISTS idx_review_reports_created ON review_reports(created_at DESC);

-- Enable RLS
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert a report (authenticated users only via application)
CREATE POLICY "Users can report reviews" ON review_reports
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT id FROM profiles WHERE id = auth.uid())
    );

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON review_reports
    FOR SELECT
    USING (
        user_id = (SELECT id FROM profiles WHERE id = auth.uid())
    );

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON review_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete reports
CREATE POLICY "Admins can delete reports" ON review_reports
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to update review report_count and is_reported flag
CREATE OR REPLACE FUNCTION update_review_report_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews
        SET
            report_count = report_count + 1,
            is_reported = TRUE
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews
        SET
            report_count = GREATEST(report_count - 1, 0),
            is_reported = (
                SELECT COUNT(*) > 0
                FROM review_reports
                WHERE review_id = OLD.review_id AND id != OLD.id
            )
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_report_insert ON review_reports;
CREATE TRIGGER on_review_report_insert
    AFTER INSERT ON review_reports
    FOR EACH ROW EXECUTE FUNCTION update_review_report_status();

DROP TRIGGER IF EXISTS on_review_report_delete ON review_reports;
CREATE TRIGGER on_review_report_delete
    AFTER DELETE ON review_reports
    FOR EACH ROW EXECUTE FUNCTION update_review_report_status();

-- Comment: Review reports table and triggers created for Q11 moderation system
