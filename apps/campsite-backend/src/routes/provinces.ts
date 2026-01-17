import { Router, type IRouter } from 'express';
import { provinceController } from '../controllers/provinceController';

const router: IRouter = Router();

/**
 * Province Routes
 *
 * GET /api/provinces - Get all provinces
 * GET /api/provinces/autocomplete - Search provinces for autocomplete
 * GET /api/provinces/:id - Get province by ID
 * GET /api/provinces/slug/:slug - Get province by slug
 * GET /api/provinces/region/:region - Get provinces by region
 */

// Autocomplete endpoint (must be before :id to avoid conflict)
router.get('/autocomplete', (req, res, next) =>
  provinceController.autocomplete(req, res, next)
);

// Get all provinces
router.get('/', (req, res, next) => provinceController.getAll(req, res, next));

// Get by slug (must be before :id)
router.get('/slug/:slug', (req, res, next) =>
  provinceController.getBySlug(req, res, next)
);

// Get by region
router.get('/region/:region', (req, res, next) =>
  provinceController.getByRegion(req, res, next)
);

// Get by ID
router.get('/:id', (req, res, next) => provinceController.getById(req, res, next));

export default router;
