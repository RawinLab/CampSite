-- Migration: Create database functions
-- Description: Helper functions for the application
-- Date: 2026-01-17

-- ============================================
-- RATING CALCULATION FUNCTION
-- ============================================

-- Calculate campsite rating from reviews
CREATE OR REPLACE FUNCTION calculate_campsite_rating(p_campsite_id UUID)
RETURNS TABLE (
    average_rating DECIMAL(2, 1),
    total_reviews INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ROUND(AVG(rating_overall)::numeric, 1), 0)::DECIMAL(2, 1) as average_rating,
        COUNT(*)::INT as total_reviews
    FROM reviews
    WHERE campsite_id = p_campsite_id AND is_hidden = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- SEARCH CAMPSITES FUNCTION
-- ============================================

-- Search campsites with filters
CREATE OR REPLACE FUNCTION search_campsites(
    p_query TEXT DEFAULT NULL,
    p_province_id INT DEFAULT NULL,
    p_type_id INT DEFAULT NULL,
    p_price_min INT DEFAULT NULL,
    p_price_max INT DEFAULT NULL,
    p_amenity_ids INT[] DEFAULT NULL,
    p_rating_min DECIMAL DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'rating',
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    province_id INT,
    province_name_th VARCHAR,
    province_name_en VARCHAR,
    type_id INT,
    type_name_th VARCHAR,
    type_name_en VARCHAR,
    price_min INT,
    price_max INT,
    rating_average DECIMAL,
    review_count INT,
    latitude DECIMAL,
    longitude DECIMAL,
    is_featured BOOLEAN,
    primary_photo_url TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT
            c.id,
            c.name,
            c.description,
            c.province_id,
            p.name_th as province_name_th,
            p.name_en as province_name_en,
            c.type_id,
            ct.name_th as type_name_th,
            ct.name_en as type_name_en,
            c.price_min,
            c.price_max,
            c.rating_average,
            c.review_count,
            c.latitude,
            c.longitude,
            c.is_featured,
            (SELECT url FROM campsite_photos WHERE campsite_id = c.id AND is_primary = true LIMIT 1) as primary_photo_url
        FROM campsites c
        JOIN provinces p ON c.province_id = p.id
        JOIN campsite_types ct ON c.type_id = ct.id
        WHERE c.status = 'approved'
          AND c.is_active = true
          AND (p_query IS NULL OR (
              c.name ILIKE '%' || p_query || '%'
              OR c.description ILIKE '%' || p_query || '%'
              OR p.name_th ILIKE '%' || p_query || '%'
              OR p.name_en ILIKE '%' || p_query || '%'
          ))
          AND (p_province_id IS NULL OR c.province_id = p_province_id)
          AND (p_type_id IS NULL OR c.type_id = p_type_id)
          AND (p_price_min IS NULL OR c.price_max >= p_price_min)
          AND (p_price_max IS NULL OR c.price_min <= p_price_max)
          AND (p_rating_min IS NULL OR c.rating_average >= p_rating_min)
          AND (p_amenity_ids IS NULL OR EXISTS (
              SELECT 1 FROM campsite_amenities ca
              WHERE ca.campsite_id = c.id
              AND ca.amenity_id = ANY(p_amenity_ids)
              GROUP BY ca.campsite_id
              HAVING COUNT(DISTINCT ca.amenity_id) = array_length(p_amenity_ids, 1)
          ))
    )
    SELECT
        f.id,
        f.name,
        f.description,
        f.province_id,
        f.province_name_th,
        f.province_name_en,
        f.type_id,
        f.type_name_th,
        f.type_name_en,
        f.price_min,
        f.price_max,
        f.rating_average,
        f.review_count,
        f.latitude,
        f.longitude,
        f.is_featured,
        f.primary_photo_url,
        COUNT(*) OVER() as total_count
    FROM filtered f
    ORDER BY
        CASE WHEN p_sort_by = 'rating' THEN f.rating_average END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'price_asc' THEN f.price_min END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN f.price_max END DESC,
        CASE WHEN p_sort_by = 'newest' THEN 1 END DESC,
        f.is_featured DESC,
        f.rating_average DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET CAMPSITE DETAILS FUNCTION
-- ============================================

-- Get full campsite details with related data
CREATE OR REPLACE FUNCTION get_campsite_details(p_campsite_id UUID)
RETURNS TABLE (
    campsite JSON,
    amenities JSON,
    accommodations JSON,
    photos JSON,
    nearby_attractions JSON,
    recent_reviews JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Campsite details
        (SELECT row_to_json(c.*)
         FROM (
             SELECT
                 cs.*,
                 p.name_th as province_name_th,
                 p.name_en as province_name_en,
                 p.slug as province_slug,
                 ct.name_th as type_name_th,
                 ct.name_en as type_name_en,
                 ct.slug as type_slug,
                 ct.color_hex as type_color,
                 pr.full_name as owner_name,
                 pr.avatar_url as owner_avatar
             FROM campsites cs
             JOIN provinces p ON cs.province_id = p.id
             JOIN campsite_types ct ON cs.type_id = ct.id
             LEFT JOIN profiles pr ON cs.owner_id = pr.id
             WHERE cs.id = p_campsite_id
         ) c
        ) as campsite,
        -- Amenities
        (SELECT COALESCE(json_agg(a.*), '[]'::json)
         FROM (
             SELECT am.id, am.name_th, am.name_en, am.slug, am.icon, am.category
             FROM campsite_amenities ca
             JOIN amenities am ON ca.amenity_id = am.id
             WHERE ca.campsite_id = p_campsite_id
             ORDER BY am.sort_order
         ) a
        ) as amenities,
        -- Accommodations
        (SELECT COALESCE(json_agg(acc.*), '[]'::json)
         FROM (
             SELECT *
             FROM accommodation_types
             WHERE campsite_id = p_campsite_id AND is_active = true
             ORDER BY sort_order
         ) acc
        ) as accommodations,
        -- Photos
        (SELECT COALESCE(json_agg(ph.*), '[]'::json)
         FROM (
             SELECT id, url, alt_text, caption, is_primary, sort_order
             FROM campsite_photos
             WHERE campsite_id = p_campsite_id
             ORDER BY is_primary DESC, sort_order
         ) ph
        ) as photos,
        -- Nearby attractions
        (SELECT COALESCE(json_agg(na.*), '[]'::json)
         FROM (
             SELECT *
             FROM nearby_attractions
             WHERE campsite_id = p_campsite_id AND is_active = true
             ORDER BY distance_km
             LIMIT 10
         ) na
        ) as nearby_attractions,
        -- Recent reviews
        (SELECT COALESCE(json_agg(r.*), '[]'::json)
         FROM (
             SELECT
                 rv.id, rv.rating_overall, rv.reviewer_type,
                 rv.title, rv.content, rv.pros, rv.cons,
                 rv.helpful_count, rv.visited_at, rv.created_at,
                 rv.owner_response, rv.owner_response_at,
                 pr.full_name as reviewer_name,
                 pr.avatar_url as reviewer_avatar,
                 (SELECT COALESCE(json_agg(json_build_object('id', rp.id, 'url', rp.url)), '[]'::json)
                  FROM review_photos rp WHERE rp.review_id = rv.id) as photos
             FROM reviews rv
             JOIN profiles pr ON rv.user_id = pr.id
             WHERE rv.campsite_id = p_campsite_id AND rv.is_hidden = false
             ORDER BY rv.created_at DESC
             LIMIT 5
         ) r
        ) as recent_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- OWNER ANALYTICS FUNCTION
-- ============================================

-- Get analytics summary for a campsite owner
CREATE OR REPLACE FUNCTION get_owner_analytics(
    p_owner_id UUID,
    p_campsite_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_views BIGINT,
    total_inquiries BIGINT,
    total_wishlist_adds BIGINT,
    total_booking_clicks BIGINT,
    total_phone_clicks BIGINT,
    views_by_day JSON,
    event_breakdown JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH owner_campsites AS (
        SELECT id FROM campsites
        WHERE owner_id = p_owner_id
          AND (p_campsite_id IS NULL OR id = p_campsite_id)
    ),
    events AS (
        SELECT * FROM analytics_events
        WHERE campsite_id IN (SELECT id FROM owner_campsites)
          AND created_at BETWEEN p_start_date AND p_end_date
    )
    SELECT
        (SELECT COUNT(*) FROM events WHERE event_type = 'profile_view')::BIGINT as total_views,
        (SELECT COUNT(*) FROM events WHERE event_type = 'inquiry_sent')::BIGINT as total_inquiries,
        (SELECT COUNT(*) FROM events WHERE event_type = 'wishlist_add')::BIGINT as total_wishlist_adds,
        (SELECT COUNT(*) FROM events WHERE event_type = 'booking_click')::BIGINT as total_booking_clicks,
        (SELECT COUNT(*) FROM events WHERE event_type = 'phone_click')::BIGINT as total_phone_clicks,
        (SELECT COALESCE(json_agg(json_build_object('date', d.date, 'views', COALESCE(e.count, 0))), '[]'::json)
         FROM generate_series(p_start_date::date, p_end_date::date, '1 day'::interval) d(date)
         LEFT JOIN (
             SELECT DATE(created_at) as date, COUNT(*) as count
             FROM events WHERE event_type = 'profile_view'
             GROUP BY DATE(created_at)
         ) e ON d.date = e.date
        ) as views_by_day,
        (SELECT COALESCE(json_agg(json_build_object('event_type', event_type, 'count', count)), '[]'::json)
         FROM (
             SELECT event_type::text, COUNT(*) as count
             FROM events
             GROUP BY event_type
         ) x
        ) as event_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- INQUIRY RATE LIMIT CHECK FUNCTION
-- ============================================

-- Check if user can send inquiry (Q18: 5 per 24h)
CREATE OR REPLACE FUNCTION can_send_inquiry(
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    inquiry_count INT;
BEGIN
    SELECT COUNT(*) INTO inquiry_count
    FROM inquiries
    WHERE (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    )
    AND created_at > NOW() - INTERVAL '24 hours';

    RETURN inquiry_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comment: All database functions created
