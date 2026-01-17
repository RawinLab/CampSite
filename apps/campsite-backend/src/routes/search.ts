import { Router, type IRouter } from 'express';
import { searchController } from '../controllers/searchController';

const router: IRouter = Router();

/**
 * Search Routes
 *
 * GET /api/search - Search campsites with filters
 * GET /api/search/featured - Get featured campsites
 * GET /api/search/types - Get campsite types
 * GET /api/search/amenities - Get amenities
 */

// Main search endpoint
router.get('/', (req, res, next) => searchController.search(req, res, next));

// Featured campsites
router.get('/featured', (req, res, next) => searchController.getFeatured(req, res, next));

// Campsite types (for filter UI)
router.get('/types', (req, res, next) => searchController.getCampsiteTypes(req, res, next));

// Amenities (for filter UI)
router.get('/amenities', (req, res, next) => searchController.getAmenities(req, res, next));

export default router;
