import type { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/searchService';
import { searchQuerySchema } from '@campsite/shared';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Search Controller
 * Handles HTTP requests for search operations
 */
export class SearchController {
  /**
   * GET /api/search
   * Search campsites with filters
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = searchQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json(
          errorResponse('Invalid search parameters', validation.error.flatten().fieldErrors)
        );
        return;
      }

      const results = await searchService.searchCampsites(validation.data);
      res.json(successResponse(results));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/featured
   * Get featured campsites
   */
  async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const campsites = await searchService.getFeaturedCampsites(Math.min(limit, 20));

      res.json(
        successResponse({
          data: campsites,
          count: campsites.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/types
   * Get all campsite types
   */
  async getCampsiteTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await searchService.getCampsiteTypes();

      res.json(
        successResponse({
          data: types,
          count: types.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/amenities
   * Get all amenities
   */
  async getAmenities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grouped = req.query.grouped === 'true';

      if (grouped) {
        const amenitiesByCategory = await searchService.getAmenitiesByCategory();
        res.json(successResponse(amenitiesByCategory));
      } else {
        const amenities = await searchService.getAmenities();
        res.json(
          successResponse({
            data: amenities,
            count: amenities.length,
          })
        );
      }
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const searchController = new SearchController();
