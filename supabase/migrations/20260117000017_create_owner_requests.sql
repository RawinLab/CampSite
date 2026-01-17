-- Migration: Create owner_requests table
-- Description: Track owner upgrade requests (Q9: self-service with verification)
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS owner_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Business information
    business_name VARCHAR(200) NOT NULL,
    business_registration VARCHAR(50),
    business_type VARCHAR(50), -- individual, company, etc.
    business_address TEXT,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),

    -- Contact person
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,

    -- Supporting documents
    id_card_url TEXT,
    business_doc_url TEXT,

    -- Request details
    reason TEXT,
    campsite_count INT DEFAULT 1, -- estimated number of campsites to list

    -- Status (Q9: Admin reviews and approves)
    status owner_request_status DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One pending request per user
    UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_owner_requests_user ON owner_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_requests_status ON owner_requests(status);
CREATE INDEX IF NOT EXISTS idx_owner_requests_created ON owner_requests(created_at DESC);

-- Comment: Owner requests table created for upgrade workflow
