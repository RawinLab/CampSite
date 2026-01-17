import type { Request, Response, NextFunction } from 'express';
import { provinceService } from '../services/provinceService';
import { provinceAutocompleteQuerySchema } from '@campsite/shared';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Province Controller
 * Handles HTTP requests for province operations
 */
export class ProvinceController {
  /**
   * GET /api/provinces/autocomplete
   * Search provinces for autocomplete dropdown
   */
  async autocomplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = provinceAutocompleteQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json(
          errorResponse('Invalid query parameters', validation.error.flatten().fieldErrors)
        );
        return;
      }

      const { q, limit } = validation.data;
      const provinces = await provinceService.searchProvinces(q, limit);

      res.json(
        successResponse({
          data: provinces,
          count: provinces.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/provinces
   * Get all provinces
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provinces = await provinceService.getAllProvinces();

      res.json(
        successResponse({
          data: provinces,
          count: provinces.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/provinces/:id
   * Get province by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json(errorResponse('Invalid province ID'));
        return;
      }

      const province = await provinceService.getProvinceById(id);

      if (!province) {
        res.status(404).json(errorResponse('Province not found'));
        return;
      }

      res.json(successResponse(province));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/provinces/slug/:slug
   * Get province by slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const province = await provinceService.getProvinceBySlug(slug);

      if (!province) {
        res.status(404).json(errorResponse('Province not found'));
        return;
      }

      res.json(successResponse(province));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/provinces/region/:region
   * Get provinces by region
   */
  async getByRegion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { region } = req.params;
      const validRegions = ['central', 'north', 'northeast', 'east', 'west', 'south'];

      if (!validRegions.includes(region)) {
        res.status(400).json(errorResponse('Invalid region'));
        return;
      }

      const provinces = await provinceService.getProvincesByRegion(region);

      res.json(
        successResponse({
          data: provinces,
          count: provinces.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const provinceController = new ProvinceController();
