-- Migration: Enable RLS on all tables
-- Description: Enable Row Level Security for all user-facing tables
-- Date: 2026-01-17

-- Enable RLS on all tables that need access control
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE campsite_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE campsite_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_requests ENABLE ROW LEVEL SECURITY;

-- Public read tables (RLS enabled but with public read access)
-- provinces, campsite_types, amenities - these are lookup tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE campsite_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Comment: RLS enabled on all tables
