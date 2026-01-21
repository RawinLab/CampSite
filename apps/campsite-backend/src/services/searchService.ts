import { supabaseAdmin } from '../lib/supabase';
import type { CampsiteCard, SearchResults, CampsiteTypeInfo, Amenity } from '@campsite/shared';
import type { SearchQuery } from '@campsite/shared';

/**
 * Search Service
 * Handles campsite search with all filter types
 */
export class SearchService {
  /**
   * Search campsites with filters, sorting, and pagination
   * @param params Search parameters
   * @returns Search results with pagination
   */
  async searchCampsites(params: SearchQuery): Promise<SearchResults> {
    const {
      q,
      provinceId,
      provinceSlug,
      types,
      minPrice,
      maxPrice,
      amenities,
      minRating,
      sort,
      page,
      limit,
      featured,
    } = params;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query - only approved campsites
    let query = supabaseAdmin
      .from('campsites')
      .select(
        `
        id,
        name,
        slug,
        description,
        price_min,
        price_max,
        rating_average,
        review_count,
        is_featured,
        campsite_types!inner (
          id,
          slug,
          name_th,
          name_en
        ),
        provinces!inner (
          id,
          name_th,
          name_en,
          slug
        ),
        campsite_photos (
          url,
          is_primary,
          sort_order
        ),
        campsite_amenities (
          amenities (
            slug
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'approved');

    // Apply text search (Q7: simple text match)
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Apply province filter
    if (provinceId) {
      query = query.eq('province_id', provinceId);
    } else if (provinceSlug) {
      query = query.eq('provinces.slug', provinceSlug);
    }

    // Apply type filter (multi-select) - filter by campsite_types.slug
    if (types && types.length > 0) {
      query = query.in('campsite_types.slug', types);
    }

    // Apply price filter
    if (minPrice !== undefined) {
      query = query.gte('price_min', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price_max', maxPrice);
    }

    // Apply rating filter
    if (minRating !== undefined) {
      query = query.gte('rating_average', minRating);
    }

    // Apply featured filter
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Apply sorting
    switch (sort) {
      case 'rating':
        query = query.order('rating_average', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price_min', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_min', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('rating_average', { ascending: false });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Transform results
    let results: CampsiteCard[] = (data || []).map((campsite: any) => ({
      id: campsite.id,
      name: campsite.name,
      description: campsite.description?.substring(0, 150) + '...' || '',
      slug: campsite.slug || campsite.id, // Use campsite's own slug
      campsite_type: campsite.campsite_types?.slug || '',
      province: {
        id: campsite.provinces.id,
        name_th: campsite.provinces.name_th,
        name_en: campsite.provinces.name_en,
        slug: campsite.provinces.slug,
      },
      min_price: campsite.price_min,
      max_price: campsite.price_max,
      average_rating: campsite.rating_average || 0,
      review_count: campsite.review_count || 0,
      is_featured: campsite.is_featured,
      thumbnail_url: this.getPrimaryPhoto(campsite.campsite_photos),
      amenities: this.extractAmenitySlugs(campsite.campsite_amenities),
    }));

    // Apply amenity AND filter (post-processing since Supabase can't do HAVING with array intersection)
    if (amenities && amenities.length > 0) {
      results = results.filter((campsite) =>
        amenities.every((amenity) => campsite.amenities.includes(amenity))
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        provinceId,
        types,
        minPrice,
        maxPrice,
        amenities,
        minRating,
      },
      sort,
    };
  }

  /**
   * Get featured campsites for homepage
   * @param limit Number of featured campsites to return
   * @returns Array of featured campsite cards
   */
  async getFeaturedCampsites(limit: number = 6): Promise<CampsiteCard[]> {
    const { data, error } = await supabaseAdmin
      .from('campsites')
      .select(
        `
        id,
        name,
        slug,
        description,
        price_min,
        price_max,
        rating_average,
        review_count,
        is_featured,
        campsite_types!inner (
          id,
          slug,
          name_th,
          name_en
        ),
        provinces!inner (
          id,
          name_th,
          name_en,
          slug
        ),
        campsite_photos (
          url,
          is_primary,
          sort_order
        ),
        campsite_amenities (
          amenities (
            slug
          )
        )
      `
      )
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('rating_average', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured campsites: ${error.message}`);
    }

    return (data || []).map((campsite: any) => ({
      id: campsite.id,
      name: campsite.name,
      description: campsite.description?.substring(0, 150) + '...' || '',
      slug: campsite.slug || campsite.id, // Use campsite's own slug
      campsite_type: campsite.campsite_types?.slug || '',
      province: {
        id: campsite.provinces.id,
        name_th: campsite.provinces.name_th,
        name_en: campsite.provinces.name_en,
        slug: campsite.provinces.slug,
      },
      min_price: campsite.price_min,
      max_price: campsite.price_max,
      average_rating: campsite.rating_average || 0,
      review_count: campsite.review_count || 0,
      is_featured: campsite.is_featured,
      thumbnail_url: this.getPrimaryPhoto(campsite.campsite_photos),
      amenities: this.extractAmenitySlugs(campsite.campsite_amenities),
    }));
  }

  /**
   * Get all campsite types
   * @returns Array of campsite type info
   */
  async getCampsiteTypes(): Promise<CampsiteTypeInfo[]> {
    const { data, error } = await supabaseAdmin
      .from('campsite_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch campsite types: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all amenities
   * @returns Array of amenities
   */
  async getAmenities(): Promise<Amenity[]> {
    const { data, error } = await supabaseAdmin
      .from('amenities')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch amenities: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get amenities grouped by category
   * @returns Amenities grouped by category
   */
  async getAmenitiesByCategory(): Promise<Record<string, Amenity[]>> {
    const amenities = await this.getAmenities();
    return amenities.reduce(
      (acc, amenity) => {
        if (!acc[amenity.category]) {
          acc[amenity.category] = [];
        }
        acc[amenity.category].push(amenity);
        return acc;
      },
      {} as Record<string, Amenity[]>
    );
  }

  /**
   * Extract primary photo URL from photos array
   */
  private getPrimaryPhoto(photos: any[]): string | null {
    if (!photos || photos.length === 0) return null;

    const primary = photos.find((p) => p.is_primary);
    if (primary) return primary.url;

    // Fall back to first photo sorted by sort_order
    const sorted = [...photos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0]?.url || null;
  }

  /**
   * Extract amenity slugs from nested structure
   */
  private extractAmenitySlugs(campsiteAmenities: any[]): string[] {
    if (!campsiteAmenities) return [];
    return campsiteAmenities
      .filter((ca) => ca.amenities?.slug)
      .map((ca) => ca.amenities.slug);
  }
}

// Export singleton instance
export const searchService = new SearchService();
