import { supabaseAdmin, createSupabaseClient } from '../lib/supabase';
import type { WishlistItem, WishlistItemWithCampsite, CampsiteCard } from '@campsite/shared';

/**
 * Get user's wishlist with campsite data
 */
export async function getWishlist(
  userId: string,
  options: { page: number; limit: number; sort: 'newest' | 'oldest' | 'name' }
): Promise<{ items: WishlistItemWithCampsite[]; total: number }> {
  const { page, limit, sort } = options;
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabaseAdmin
    .from('wishlists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Build query with sorting
  let query = supabaseAdmin
    .from('wishlists')
    .select(`
      id,
      user_id,
      campsite_id,
      notes,
      created_at,
      campsites!inner (
        id,
        name,
        description,
        slug,
        campsite_type,
        min_price,
        max_price,
        average_rating,
        review_count,
        is_featured,
        province_id,
        provinces!inner (
          id,
          name_th,
          name_en,
          slug
        ),
        campsite_photos (
          url,
          is_primary
        ),
        campsite_amenities (
          amenity_id,
          amenities!inner (
            slug
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('campsites.is_active', true)
    .eq('campsites.status', 'approved');

  // Apply sorting
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'name') {
    query = query.order('campsites(name)', { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching wishlist:', error);
    throw new Error('Failed to fetch wishlist');
  }

  // Transform data to match expected format
  const items: WishlistItemWithCampsite[] = (data || []).map((item: any) => {
    const campsite = item.campsites;
    const primaryPhoto = campsite.campsite_photos?.find((p: any) => p.is_primary);
    const thumbnailUrl = primaryPhoto?.url || campsite.campsite_photos?.[0]?.url || null;
    const amenitySlugs = campsite.campsite_amenities?.map((ca: any) => ca.amenities?.slug).filter(Boolean) || [];

    return {
      id: item.id,
      user_id: item.user_id,
      campsite_id: item.campsite_id,
      notes: item.notes,
      created_at: item.created_at,
      campsite: {
        id: campsite.id,
        name: campsite.name,
        description: campsite.description,
        slug: campsite.slug,
        campsite_type: campsite.campsite_type,
        province: {
          id: campsite.provinces.id,
          name_th: campsite.provinces.name_th,
          name_en: campsite.provinces.name_en,
          slug: campsite.provinces.slug,
        },
        min_price: campsite.min_price,
        max_price: campsite.max_price,
        average_rating: campsite.average_rating,
        review_count: campsite.review_count,
        is_featured: campsite.is_featured,
        thumbnail_url: thumbnailUrl,
        amenities: amenitySlugs,
      } as CampsiteCard,
    };
  });

  return { items, total: count || 0 };
}

/**
 * Add campsite to user's wishlist
 */
export async function addToWishlist(
  userId: string,
  campsiteId: string,
  notes?: string
): Promise<WishlistItem> {
  // Check if campsite exists and is active
  const { data: campsite, error: campsiteError } = await supabaseAdmin
    .from('campsites')
    .select('id')
    .eq('id', campsiteId)
    .eq('status', 'approved')
    .eq('is_active', true)
    .single();

  if (campsiteError || !campsite) {
    throw new Error('Campsite not found or not available');
  }

  // Check if already in wishlist
  const { data: existing } = await supabaseAdmin
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('campsite_id', campsiteId)
    .single();

  if (existing) {
    throw new Error('Campsite already in wishlist');
  }

  // Add to wishlist
  const { data, error } = await supabaseAdmin
    .from('wishlists')
    .insert({
      user_id: userId,
      campsite_id: campsiteId,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding to wishlist:', error);
    throw new Error('Failed to add to wishlist');
  }

  return data;
}

/**
 * Remove campsite from user's wishlist
 */
export async function removeFromWishlist(
  userId: string,
  campsiteId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('campsite_id', campsiteId);

  if (error) {
    console.error('Error removing from wishlist:', error);
    throw new Error('Failed to remove from wishlist');
  }
}

/**
 * Check if campsite is in user's wishlist
 */
export async function isInWishlist(
  userId: string,
  campsiteId: string
): Promise<{ is_wishlisted: boolean; wishlist_id: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('campsite_id', campsiteId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error checking wishlist:', error);
    throw new Error('Failed to check wishlist status');
  }

  return {
    is_wishlisted: !!data,
    wishlist_id: data?.id || null,
  };
}

/**
 * Batch check if campsites are in user's wishlist
 */
export async function batchCheckWishlist(
  userId: string,
  campsiteIds: string[]
): Promise<Record<string, boolean>> {
  const { data, error } = await supabaseAdmin
    .from('wishlists')
    .select('campsite_id')
    .eq('user_id', userId)
    .in('campsite_id', campsiteIds);

  if (error) {
    console.error('Error batch checking wishlist:', error);
    throw new Error('Failed to check wishlist status');
  }

  const wishlistedIds = new Set(data?.map((item) => item.campsite_id) || []);
  const result: Record<string, boolean> = {};

  for (const id of campsiteIds) {
    result[id] = wishlistedIds.has(id);
  }

  return result;
}

/**
 * Get wishlist count for user
 */
export async function getWishlistCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('wishlists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting wishlist count:', error);
    throw new Error('Failed to get wishlist count');
  }

  return count || 0;
}
