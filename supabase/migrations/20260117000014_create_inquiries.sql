-- Migration: Create inquiries table
-- Description: Contact inquiries from travelers to campsite owners
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Guest info (in case not logged in)
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),

    -- Inquiry details
    inquiry_type inquiry_type NOT NULL DEFAULT 'general',
    subject VARCHAR(200),
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 20 AND 2000),
    check_in_date DATE,
    check_out_date DATE,
    guest_count INT,
    accommodation_type_id UUID REFERENCES accommodation_types(id),

    -- Response
    status inquiry_status DEFAULT 'new',
    owner_reply TEXT,
    replied_at TIMESTAMPTZ,

    -- Tracking
    read_at TIMESTAMPTZ,
    ip_address INET,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_campsite ON inquiries(campsite_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(inquiry_type);

-- Comment: Inquiries table created for contact form submissions
