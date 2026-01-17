-- Migration: Create all ENUM types
-- Description: Creates all enum types used throughout the database
-- Date: 2026-01-17

-- Campsite status enum (for approval workflow)
DO $$ BEGIN
  CREATE TYPE campsite_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Reviewer type enum (for review categorization)
DO $$ BEGIN
  CREATE TYPE reviewer_type AS ENUM ('family', 'couple', 'solo', 'group');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Inquiry type enum
DO $$ BEGIN
  CREATE TYPE inquiry_type AS ENUM ('booking', 'general', 'complaint', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Inquiry status enum
DO $$ BEGIN
  CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Attraction category enum
DO $$ BEGIN
  CREATE TYPE attraction_category AS ENUM ('hiking', 'waterfall', 'temple', 'viewpoint', 'lake', 'cave', 'market', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Difficulty level enum
DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'hard');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Analytics event type enum
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'search_impression',
    'profile_view',
    'booking_click',
    'inquiry_sent',
    'wishlist_add',
    'phone_click',
    'website_click'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Owner request status enum
DO $$ BEGIN
  CREATE TYPE owner_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Comment: All enums created successfully
