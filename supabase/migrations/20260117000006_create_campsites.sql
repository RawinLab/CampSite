-- Migration: Create campsites table
-- Description: Main campsite listings table
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS campsites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    province_id INT NOT NULL REFERENCES provinces(id),
    type_id INT NOT NULL REFERENCES campsite_types(id),

    -- Basic Info
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Location
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    line_id VARCHAR(50),
    booking_url TEXT, -- external booking link

    -- Policies
    check_in_time TIME DEFAULT '14:00',
    check_out_time TIME DEFAULT '12:00',
    min_stay_nights INT DEFAULT 1,
    max_stay_nights INT,
    cancellation_policy TEXT,
    rules TEXT,

    -- Pricing (for filtering)
    price_min INT NOT NULL DEFAULT 0,
    price_max INT NOT NULL DEFAULT 0,

    -- Computed/Cached
    rating_average DECIMAL(2, 1) DEFAULT 0,
    review_count INT DEFAULT 0,

    -- Status & Approval (Q8: Admin approval required)
    status campsite_status DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_campsites_owner ON campsites(owner_id);
CREATE INDEX IF NOT EXISTS idx_campsites_province ON campsites(province_id);
CREATE INDEX IF NOT EXISTS idx_campsites_type ON campsites(type_id);
CREATE INDEX IF NOT EXISTS idx_campsites_price ON campsites(price_min, price_max);
CREATE INDEX IF NOT EXISTS idx_campsites_rating ON campsites(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_campsites_status ON campsites(status);
CREATE INDEX IF NOT EXISTS idx_campsites_featured ON campsites(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_campsites_approved ON campsites(status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_campsites_active ON campsites(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_campsites_created ON campsites(created_at DESC);

-- Full-text search index on name and description
CREATE INDEX IF NOT EXISTS idx_campsites_name_search ON campsites USING GIN (
    to_tsvector('simple', name || ' ' || COALESCE(description, ''))
);

-- Comment: Campsites table created with all required fields
