-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'partially_refunded');

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campsite_id UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Booking details
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    nights_count INTEGER NOT NULL,
    
    -- Pricing
    total_price DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Status
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'unpaid',
    
    -- Additional info
    special_requests TEXT,
    guest_info JSONB, -- { name, phone, email, id_card }
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_guests CHECK (guests_count > 0),
    CONSTRAINT valid_price CHECK (total_price >= 0)
);

-- Create booking accommodations table (for multiple room bookings)
CREATE TABLE IF NOT EXISTS booking_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    accommodation_type_id UUID NOT NULL REFERENCES accommodation_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_night DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_accommodation_price CHECK (price_per_night >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_bookings_campsite_id ON bookings(campsite_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_booking_accommodations_booking_id ON booking_accommodations(booking_id);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_accommodations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Campsite owners can view bookings for their campsites" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campsites 
            WHERE campsites.id = bookings.campsite_id 
            AND campsites.owner_id = auth.uid()
        )
    );

-- RLS Policies for booking_accommodations
CREATE POLICY "Users can view their booking accommodations" ON booking_accommodations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_accommodations.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate nights count automatically
CREATE OR REPLACE FUNCTION calculate_nights()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nights_count := NEW.check_out_date - NEW.check_in_date;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_booking_nights
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_nights();
