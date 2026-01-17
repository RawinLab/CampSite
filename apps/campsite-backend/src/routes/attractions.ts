import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validateQuery } from '../middleware/validation';
import type { AttractionsResponse } from '@campsite/shared';

const router: RouterType = Router();

// Query schema for attractions
const attractionsQuerySchema = z.object({
  max_distance_km: z.coerce.number().min(0).max(100).default(20),
  category: z.string().optional(), // comma-separated categories
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * GET /api/campsites/:campsiteId/attractions
 * Get nearby attractions for a campsite
 */
router.get(
  '/campsites/:campsiteId/attractions',
  validateQuery(attractionsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { campsiteId } = req.params;
      const { max_distance_km, category, limit } = req.query as unknown as z.infer<
        typeof attractionsQuerySchema
      >;

      // Verify campsite exists
      const { data: campsite, error: campsiteError } = await supabaseAdmin
        .from('campsites')
        .select('id')
        .eq('id', campsiteId)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();

      if (campsiteError || !campsite) {
        return res.status(404).json({ error: 'Campsite not found' });
      }

      // Build attractions query
      let query = supabaseAdmin
        .from('nearby_attractions')
        .select('*')
        .eq('campsite_id', campsiteId)
        .lte('distance_km', max_distance_km)
        .order('distance_km', { ascending: true });

      // Filter by category
      if (category) {
        const categories = category.split(',').filter(Boolean);
        if (categories.length > 0) {
          query = query.in('category', categories);
        }
      }

      // Limit results
      query = query.limit(limit);

      const { data: attractions, error } = await query;

      if (error) {
        console.error('Attractions query error:', error);
        return res.status(500).json({ error: 'Failed to fetch attractions' });
      }

      const response: AttractionsResponse = {
        attractions: attractions || [],
        total: attractions?.length || 0,
      };

      res.json(response);
    } catch (error) {
      console.error('Attractions error:', error);
      res.status(500).json({ error: 'Failed to fetch attractions' });
    }
  }
);

/**
 * GET /api/attractions/:id
 * Get single attraction details
 */
router.get('/attractions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: attraction, error } = await supabaseAdmin
      .from('nearby_attractions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !attraction) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    res.json(attraction);
  } catch (error) {
    console.error('Get attraction error:', error);
    res.status(500).json({ error: 'Failed to fetch attraction' });
  }
});

export default router;
