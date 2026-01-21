import { supabaseAdmin } from '../lib/supabase';
import type {
  CampsiteDetail,
  CampsitePhoto,
  AccommodationType,
  NearbyAttraction,
  CampsiteReview,
  ReviewSummary,
  Campsite,
  Province,
  Amenity,
} from '@campsite/shared';
import { getReviewSummary, getRecentReviews } from './reviewService';

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CampsiteService {
  /**
   * Get campsite detail by ID or slug
   * Only returns approved campsites for public access
   */
  async getCampsiteById(idOrSlug: string, includeNonApproved = false): Promise<CampsiteDetail | null> {
    const isUUID = UUID_REGEX.test(idOrSlug);

    // Build query for campsite - lookup by ID or slug
    let query = supabaseAdmin
      .from('campsites')
      .select(`
        *,
        province:provinces(*),
        owner:profiles!campsites_owner_id_fkey(id, full_name, avatar_url, created_at)
      `);

    // Match by ID or slug
    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    // For public access, only show approved and active campsites
    if (!includeNonApproved) {
      query = query.eq('status', 'approved').eq('is_active', true);
    }

    const { data: campsite, error: campsiteError } = await query.single();

    if (campsiteError || !campsite) {
      return null;
    }

    // Use the actual campsite ID for related data queries
    const campsiteId = campsite.id;

    // Fetch related data in parallel
    const [photos, amenities, accommodations, attractions, reviewSummary, recentReviews] = await Promise.all([
      this.getCampsitePhotos(campsiteId),
      this.getCampsiteAmenities(campsiteId),
      this.getAccommodationTypes(campsiteId),
      this.getNearbyAttractions(campsiteId),
      getReviewSummary(campsiteId),
      getRecentReviews(campsiteId, 5),
    ]);

    // Build response
    const campsiteDetail: CampsiteDetail = {
      id: campsite.id,
      owner_id: campsite.owner_id,
      name: campsite.name,
      description: campsite.description,
      province_id: campsite.province_id,
      address: campsite.address,
      latitude: campsite.latitude,
      longitude: campsite.longitude,
      campsite_type: campsite.type_id === 1 ? 'camping' : campsite.type_id === 2 ? 'glamping' : campsite.type_id === 3 ? 'tented-resort' : 'bungalow',
      status: campsite.status,
      is_featured: campsite.is_featured,
      average_rating: campsite.rating_average || 0,
      review_count: campsite.review_count || 0,
      min_price: campsite.price_min,
      max_price: campsite.price_max,
      check_in_time: campsite.check_in_time,
      check_out_time: campsite.check_out_time,
      phone: campsite.phone,
      email: campsite.email,
      website: campsite.website,
      booking_url: campsite.booking_url,
      facebook_url: campsite.facebook_url,
      instagram_url: campsite.instagram_url,
      created_at: campsite.created_at,
      updated_at: campsite.updated_at,
      province: campsite.province as Province,
      owner: campsite.owner,
      photos,
      amenities,
      accommodation_types: accommodations,
      nearby_attractions: attractions,
      review_summary: reviewSummary,
      recent_reviews: recentReviews,
    };

    return campsiteDetail;
  }

  /**
   * Get campsite photos ordered by sort_order
   */
  async getCampsitePhotos(campsiteId: string): Promise<CampsitePhoto[]> {
    const { data, error } = await supabaseAdmin
      .from('campsite_photos')
      .select('*')
      .eq('campsite_id', campsiteId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching campsite photos:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get campsite amenities with full amenity details
   */
  async getCampsiteAmenities(campsiteId: string): Promise<Amenity[]> {
    const { data, error } = await supabaseAdmin
      .from('campsite_amenities')
      .select(`
        amenity:amenities(*)
      `)
      .eq('campsite_id', campsiteId);

    if (error) {
      console.error('Error fetching campsite amenities:', error);
      return [];
    }

    return (data || []).map((item: any) => item.amenity).filter(Boolean);
  }

  /**
   * Get accommodation types for a campsite
   */
  async getAccommodationTypes(campsiteId: string): Promise<AccommodationType[]> {
    const { data, error } = await supabaseAdmin
      .from('accommodation_types')
      .select('*')
      .eq('campsite_id', campsiteId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching accommodation types:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      amenities_included: item.amenities_included || [],
    }));
  }

  /**
   * Get nearby attractions for a campsite
   */
  async getNearbyAttractions(campsiteId: string): Promise<NearbyAttraction[]> {
    const { data, error } = await supabaseAdmin
      .from('nearby_attractions')
      .select('*')
      .eq('campsite_id', campsiteId)
      .order('distance_km', { ascending: true });

    if (error) {
      console.error('Error fetching nearby attractions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if campsite exists and is accessible
   * Supports both UUID and slug lookup
   */
  async campsiteExists(idOrSlug: string): Promise<boolean> {
    const isUUID = UUID_REGEX.test(idOrSlug);

    let query = supabaseAdmin
      .from('campsites')
      .select('id')
      .eq('status', 'approved')
      .eq('is_active', true);

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.single();
    return !error && !!data;
  }

  /**
   * Get campsite ID from slug (for when you need the UUID)
   */
  async getCampsiteIdFromSlug(slug: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('campsites')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }
    return data.id;
  }

  /**
   * Track campsite view analytics
   */
  async trackCampsiteView(campsiteId: string, userId?: string): Promise<void> {
    try {
      await supabaseAdmin.from('analytics_events').insert({
        campsite_id: campsiteId,
        user_id: userId || null,
        event_type: 'profile_view',
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      // Don't fail the request if analytics fails
      console.error('Error tracking campsite view:', error);
    }
  }

  /**
   * Get multiple campsites for comparison
   * Returns full details for 2-3 campsites
   */
  async getCampsitesForComparison(ids: string[]): Promise<CampsiteDetail[]> {
    // Limit to max 3 campsites
    const limitedIds = ids.slice(0, 3);

    // Fetch all campsites in parallel
    const campsites = await Promise.all(
      limitedIds.map((id) => this.getCampsiteById(id))
    );

    // Filter out null results (non-existent or non-approved campsites)
    return campsites.filter((c): c is CampsiteDetail => c !== null);
  }
}

export const campsiteService = new CampsiteService();
