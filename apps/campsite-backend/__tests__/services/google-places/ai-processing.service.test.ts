// Mock dependencies BEFORE importing the service
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockTypeClassifier = {
  classifyType: jest.fn(),
};

const mockDeduplication = {
  detectDuplicate: jest.fn(),
};

const mockProvinceMatcher = {
  matchByCoordinates: jest.fn(),
};

jest.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => mockLogger);
jest.mock('../../../src/services/google-places/type-classifier.service', () => mockTypeClassifier);
jest.mock('../../../src/services/google-places/deduplication.service', () => mockDeduplication);
jest.mock('../../../src/services/google-places/province-matcher.service', () => mockProvinceMatcher);

import { supabaseAdmin } from '../../../src/lib/supabase';

describe('AIProcessingService', () => {
  let aiProcessingService: any;

  const mockRawPlace = {
    id: 'raw-place-1',
    place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    raw_data: {
      name: 'Sunset Camping Ground',
      formatted_address: '123 Mountain Road, Chiang Mai 50200',
      types: ['campground', 'point_of_interest'],
      price_level: 2,
      rating: 4.5,
      user_ratings_total: 150,
      formatted_phone_number: '053-123456',
      website: 'https://www.sunsetcamp.com',
      geometry: {
        location: {
          lat: 18.7883,
          lng: 98.9853,
        },
      },
      photos: [{ photo_reference: 'photo1' }],
      reviews: [],
      business_status: 'OPERATIONAL',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('processPlace', () => {
    it('orchestrates all services correctly', async () => {
      (supabaseAdmin.single as jest.Mock).mockResolvedValue({
        data: mockRawPlace,
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: false,
        duplicateOfCampsiteId: undefined,
        similarityScore: 0.3,
        similarCampsites: [],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.9,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlace('raw-place-1');

      expect(result).toBeDefined();
      expect(result.placeId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
      expect(result.name).toBe('Sunset Camping Ground');
      expect(result.isDuplicate).toBe(false);
      expect(result.suggestedTypeId).toBe(1);
      expect(result.suggestedProvinceId).toBe(2);

      expect(mockDeduplication.detectDuplicate).toHaveBeenCalled();
      expect(mockTypeClassifier.classifyType).toHaveBeenCalled();
      expect(mockProvinceMatcher.matchByCoordinates).toHaveBeenCalledWith(18.7883, 98.9853);
    });

    it('creates import candidates with confidence scores', async () => {
      (supabaseAdmin.single as jest.Mock)
        .mockResolvedValueOnce({
          data: mockRawPlace,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        });

      (supabaseAdmin.insert as jest.Mock).mockResolvedValue({
        data: { id: 'candidate-1' },
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: false,
        duplicateOfCampsiteId: undefined,
        similarityScore: 0.2,
        similarCampsites: [],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.85,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlace('raw-place-1');

      expect(result.confidenceScore).toBeGreaterThan(0.8);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('handles errors gracefully', async () => {
      (supabaseAdmin.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlace('non-existent-id');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('calculates high confidence for duplicates', async () => {
      (supabaseAdmin.single as jest.Mock).mockResolvedValue({
        data: mockRawPlace,
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: true,
        duplicateOfCampsiteId: 'existing-campsite-1',
        similarityScore: 0.95,
        similarCampsites: [
          {
            campsiteId: 'existing-campsite-1',
            name: 'Sunset Camping Ground',
            similarityScore: 0.95,
            distanceKm: 0.05,
            address: '123 Mountain Road',
          },
        ],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.8,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlace('raw-place-1');

      expect(result.isDuplicate).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9);
    });

    it('generates validation warnings for missing data', async () => {
      const placeWithMissingData = {
        ...mockRawPlace,
        raw_data: {
          ...mockRawPlace.raw_data,
          formatted_phone_number: undefined,
          website: undefined,
          rating: 2.5,
        },
      };

      (supabaseAdmin.single as jest.Mock).mockResolvedValue({
        data: placeWithMissingData,
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: false,
        duplicateOfCampsiteId: undefined,
        similarityScore: 0.1,
        similarCampsites: [],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.7,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlace('raw-place-1');

      expect(result.validationWarnings).toContain('Missing phone number');
      expect(result.validationWarnings).toContain('Missing website');
      expect(result.validationWarnings).toContain('Low or missing rating');
    });
  });

  describe('processPlaces', () => {
    it('processes multiple places and returns statistics', async () => {
      (supabaseAdmin.single as jest.Mock)
        .mockResolvedValueOnce({
          data: mockRawPlace,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        .mockResolvedValueOnce({
          data: { ...mockRawPlace, id: 'raw-place-2' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

      (supabaseAdmin.insert as jest.Mock).mockResolvedValue({
        data: { id: 'candidate-1' },
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: false,
        duplicateOfCampsiteId: undefined,
        similarityScore: 0.3,
        similarCampsites: [],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.85,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      const result = await aiProcessingService.processPlaces(['raw-place-1', 'raw-place-2']);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.candidatesCreated).toBe(2);
    });

    it('throws error when processing is already running', async () => {
      (supabaseAdmin.single as jest.Mock).mockResolvedValue({
        data: mockRawPlace,
        error: null,
      });

      (supabaseAdmin.insert as jest.Mock).mockResolvedValue({
        data: { id: 'candidate-1' },
        error: null,
      });

      mockDeduplication.detectDuplicate.mockResolvedValue({
        isDuplicate: false,
        duplicateOfCampsiteId: undefined,
        similarityScore: 0.3,
        similarCampsites: [],
      });

      mockTypeClassifier.classifyType.mockResolvedValue({
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.85,
      });

      mockProvinceMatcher.matchByCoordinates.mockResolvedValue({
        id: 2,
        name: 'Chiang Mai',
      });

      const module = await import('../../../src/services/google-places/ai-processing.service');
      aiProcessingService = module.default;

      // Start first processing (don't await)
      const promise1 = aiProcessingService.processPlaces(['raw-place-1']);

      // Try to start second processing immediately
      await expect(
        aiProcessingService.processPlaces(['raw-place-2'])
      ).rejects.toThrow('AI processing is already running');

      await promise1;
    });
  });
});
