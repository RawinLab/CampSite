import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validateQuery } from '../middleware/validation';
import type { MapCampsite, MapCampsitesResponse } from '@campsite/shared';

const router: RouterType = Router();

// Query schema for map campsites
const mapCampsitesQuerySchema = z.object({
  north: z.coerce.number().min(-90).max(90).optional(),
  south: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  west: z.coerce.number().min(-180).max(180).optional(),
  campsite_types: z.string().optional(), // comma-separated
  province_id: z.coerce.number().positive().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  amenity_ids: z.string().optional(), // comma-separated
  limit: z.coerce.number().min(1).max(500).default(200),
});

/**
 * GET /api/map/campsites
 * Get lightweight campsite data for map markers
 * Supports filtering by bounds, type, province, price, rating, amenities
 */
router.get(
  '/campsites',
  validateQuery(mapCampsitesQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const {
        north,
        south,
        east,
        west,
        campsite_types,
        province_id,
        min_price,
        max_price,
        min_rating,
        amenity_ids,
        limit,
      } = req.query as unknown as z.infer<typeof mapCampsitesQuerySchema>;

      // Build query for approved, active campsites
      let query = supabaseAdmin
        .from('campsites')
        .select(
          `
          id,
          name,
          latitude,
          longitude,
          campsite_type,
          average_rating,
          review_count,
          min_price,
          max_price,
          provinces!inner (name_en),
          campsite_photos (url)
        `
        )
        .eq('status', 'approved')
        .eq('is_active', true);

      // Apply bounds filter if all bounds are provided
      if (
        north !== undefined &&
        south !== undefined &&
        east !== undefined &&
        west !== undefined
      ) {
        query = query
          .gte('latitude', south)
          .lte('latitude', north)
          .gte('longitude', west)
          .lte('longitude', east);
      }

      // Filter by campsite types
      if (campsite_types) {
        const types = campsite_types.split(',').filter(Boolean);
        if (types.length > 0) {
          query = query.in('campsite_type', types);
        }
      }

      // Filter by province
      if (province_id) {
        query = query.eq('province_id', province_id);
      }

      // Filter by price range
      if (min_price !== undefined) {
        query = query.gte('max_price', min_price);
      }
      if (max_price !== undefined) {
        query = query.lte('min_price', max_price);
      }

      // Filter by minimum rating
      if (min_rating !== undefined) {
        query = query.gte('average_rating', min_rating);
      }

      // Filter by amenities (requires join)
      if (amenity_ids) {
        const ids = amenity_ids
          .split(',')
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));
        if (ids.length > 0) {
          // Subquery for campsites with all specified amenities
          const { data: campsiteIds } = await supabaseAdmin
            .from('campsite_amenities')
            .select('campsite_id')
            .in('amenity_id', ids);

          if (campsiteIds && campsiteIds.length > 0) {
            // Count amenities per campsite and filter those with all required amenities
            const campsiteCounts = campsiteIds.reduce(
              (acc: Record<string, number>, { campsite_id }: { campsite_id: string }) => {
                acc[campsite_id] = (acc[campsite_id] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );

            const matchingCampsiteIds = Object.entries(campsiteCounts)
              .filter(([, count]) => (count as number) >= ids.length)
              .map(([id]) => id);

            if (matchingCampsiteIds.length > 0) {
              query = query.in('id', matchingCampsiteIds);
            } else {
              // No campsites match all amenities
              return res.json({ campsites: [], total: 0 });
            }
          } else {
            // No campsites have any of the specified amenities
            return res.json({ campsites: [], total: 0 });
          }
        }
      }

      // Limit results
      query = query.limit(limit);

      const { data: rawCampsites, error, count } = await query;

      if (error) {
        console.error('Map campsites query error:', error);
        return res.status(500).json({ error: 'Failed to fetch campsites' });
      }

      // Transform data to MapCampsite format
      const campsites: MapCampsite[] = (rawCampsites || []).map((campsite: any) => ({
        id: campsite.id,
        name: campsite.name,
        latitude: campsite.latitude,
        longitude: campsite.longitude,
        campsite_type: campsite.campsite_type,
        average_rating: campsite.average_rating || 0,
        review_count: campsite.review_count || 0,
        min_price: campsite.min_price,
        max_price: campsite.max_price,
        province_name_en: campsite.provinces?.name_en || '',
        primary_photo_url: campsite.campsite_photos?.[0]?.url || null,
      }));

      const response: MapCampsitesResponse = {
        campsites,
        total: campsites.length,
      };

      res.json(response);
    } catch (error) {
      console.error('Map campsites error:', error);
      res.status(500).json({ error: 'Failed to fetch map campsites' });
    }
  }
);

/**
 * GET /api/map/campsites/:id
 * Get single campsite data for map popup
 */
router.get('/campsites/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: campsite, error } = await supabaseAdmin
      .from('campsites')
      .select(
        `
        id,
        name,
        latitude,
        longitude,
        campsite_type,
        average_rating,
        review_count,
        min_price,
        max_price,
        provinces!inner (name_en),
        campsite_photos (url)
      `
      )
      .eq('id', id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (error || !campsite) {
      return res.status(404).json({ error: 'Campsite not found' });
    }

    const mapCampsite: MapCampsite = {
      id: campsite.id,
      name: campsite.name,
      latitude: campsite.latitude,
      longitude: campsite.longitude,
      campsite_type: campsite.campsite_type,
      average_rating: campsite.average_rating || 0,
      review_count: campsite.review_count || 0,
      min_price: campsite.min_price,
      max_price: campsite.max_price,
      province_name_en: (campsite.provinces as any)?.name_en || '',
      primary_photo_url: (campsite.campsite_photos as any[])?.[0]?.url || null,
    };

    res.json(mapCampsite);
  } catch (error) {
    console.error('Get map campsite error:', error);
    res.status(500).json({ error: 'Failed to fetch campsite' });
  }
});

export default router;
