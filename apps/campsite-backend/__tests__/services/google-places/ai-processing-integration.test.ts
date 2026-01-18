/**
 * AI Processing Pipeline Integration Tests
 * Tests the full pipeline integration: deduplication, type classification, province matching
 */

import type { GooglePlaceDetails } from '@campsite/shared';

// Mock provinces data - DEFINED BEFORE jest.mock()
const MOCK_PROVINCES = [
  { id: 1, name_en: 'Bangkok', name_th: 'กรุงเทพมหานคร', slug: 'bangkok', latitude: 13.7563, longitude: 100.5018 },
  { id: 2, name_en: 'Nakhon Ratchasima', name_th: 'นครราชสีมา', slug: 'nakhon-ratchasima', latitude: 14.4447, longitude: 101.3645 },
  { id: 3, name_en: 'Chiang Mai', name_th: 'เชียงใหม่', slug: 'chiang-mai', latitude: 18.9076, longitude: 98.9185 },
  { id: 4, name_en: 'Phuket', name_th: 'ภูเก็ต', slug: 'phuket', latitude: 7.8958, longitude: 98.3015 },
];

jest.mock('../../../src/lib/supabase', () => {
  const mockFrom = jest.fn().mockImplementation((table: string) => {
    if (table === 'provinces') {
      return {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: MOCK_PROVINCES, error: null }),
      };
    }
    return { select: jest.fn() };
  });

  return {
    supabaseAdmin: { from: mockFrom, rpc: jest.fn() },
  };
});

jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../../src/lib/supabase';
import aiProcessingService from '../../../src/services/google-places/ai-processing.service';

describe('AI Processing Pipeline Integration', () => {
  const mockRawPlace1 = {
    id: 'raw-place-1',
    place_id: 'ChIJ_camping_khao_yai_001',
    raw_data: {
      place_id: 'ChIJ_camping_khao_yai_001',
      name: 'Camping Khao Yai',
      formatted_address: '123 Thanarat Road, Pak Chong, Nakhon Ratchasima 30130',
      geometry: { location: { lat: 14.4447, lng: 101.3645 } },
      types: ['campground', 'lodging'],
      rating: 4.5,
      user_ratings_total: 120,
      formatted_phone_number: '044-123-456',
      website: 'https://camping-khaoyai.com',
      business_status: 'OPERATIONAL',
      price_level: 2,
    } as GooglePlaceDetails,
  };

  const mockExistingCampsite = {
    id: 'existing-campsite-1',
    name: 'Camping Khao Yai',
    address: '123 Thanarat Road, Pak Chong, Nakhon Ratchasima 30130',
    latitude: 14.4447,
    longitude: 101.3645,
    phone: '044-123-456',
    website: 'https://camping-khaoyai.com',
    is_active: true,
  };

  const setupMocks = (config: { rawPlaceData?: any; campsiteData?: any[]; candidateExists?: boolean }) => {
    (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'provinces') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: MOCK_PROVINCES, error: null }),
        };
      }
      if (table === 'google_places_raw') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: config.rawPlaceData,
            error: config.rawPlaceData ? null : { message: 'Not found' },
          }),
        };
      }
      if (table === 'campsites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: config.campsiteData || [], error: null }),
        };
      }
      if (table === 'google_places_import_candidates') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: config.candidateExists ? { id: 'existing' } : null,
            error: config.candidateExists ? null : { code: 'PGRST116' },
          }),
          insert: jest.fn().mockResolvedValue({ data: { id: 'new-candidate' }, error: null }),
          update: jest.fn().mockReturnThis(),
        };
      }
      return { select: jest.fn() };
    });
    (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('T031-01: Full Pipeline Integration', () => {
    it('should process a place through complete pipeline with all required fields', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.rawPlaceId).toBe(mockRawPlace1.id);
        expect(processed.name).toBe('Camping Khao Yai');
        expect(processed.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(processed.isDuplicate).toBe(false);
        expect(processed.suggestedProvinceId).toBeGreaterThanOrEqual(1);
        expect(processed.suggestedProvinceId).toBeLessThanOrEqual(4);
        expect(processed.suggestedTypeId).toBe(1);
        expect(processed.validationWarnings).toBeInstanceOf(Array);
      }
    });

    it('should calculate confidence scores correctly', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.confidenceScore).toBeLessThanOrEqual(1);
        expect(processed.confidenceScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('T031-02: Deduplication Integration', () => {
    it('should detect duplicate by phone number', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1, campsiteData: [mockExistingCampsite] });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.isDuplicate).toBe(true);
        expect(processed.duplicateOfCampsiteId).toBe(mockExistingCampsite.id);
      }
    });

    it('should detect duplicate by website URL', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1, campsiteData: [mockExistingCampsite] });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.isDuplicate).toBe(true);
      }
    });

    it('should detect duplicate by location proximity', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1, campsiteData: [mockExistingCampsite] });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.isDuplicate).toBe(true);
        expect(processed.duplicateOfCampsiteId).toBe(mockExistingCampsite.id);
      }
    });

    it('should mark non-duplicates correctly', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.isDuplicate).toBe(false);
      }
    });
  });

  describe('T031-03: Type Classification Integration', () => {
    it('should classify camping type from keywords', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedTypeId).toBe(1);
      }
    });

    it('should classify glamping from name', async () => {
      const glampingPlace = {
        ...mockRawPlace1,
        id: 'glamping-1',
        raw_data: { ...mockRawPlace1.raw_data, name: 'Glamping Paradise' } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: glampingPlace });

      const processed = await aiProcessingService.processPlace(glampingPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedTypeId).toBe(2);
      }
    });

    it('should classify bungalow from keywords', async () => {
      const bungalowPlace = {
        ...mockRawPlace1,
        id: 'bungalow-1',
        raw_data: { ...mockRawPlace1.raw_data, name: 'Bungalow Resort' } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: bungalowPlace });

      const processed = await aiProcessingService.processPlace(bungalowPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedTypeId).toBe(4);
      }
    });

    it('should use fallback type when ambiguous', async () => {
      const ambiguousPlace = {
        ...mockRawPlace1,
        id: 'ambiguous-1',
        raw_data: {
          ...mockRawPlace1.raw_data,
          name: 'Nature Stay',
          types: ['lodging'],
        } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: ambiguousPlace });

      const processed = await aiProcessingService.processPlace(ambiguousPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedTypeId).toBe(1);
        expect(processed.confidenceScore).toBeLessThan(0.7);
      }
    });
  });

  describe('T031-04: Province Matching Integration', () => {
    it('should match province by coordinates', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const processed = await aiProcessingService.processPlace(mockRawPlace1.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedProvinceId).toBeGreaterThanOrEqual(1);
        expect(processed.suggestedProvinceId).toBeLessThanOrEqual(4);
      }
    });

    it('should match Chiang Mai province by coordinates', async () => {
      const chiangMaiPlace = {
        ...mockRawPlace1,
        id: 'chiangmai-1',
        raw_data: {
          ...mockRawPlace1.raw_data,
          geometry: { location: { lat: 18.9076, lng: 98.9185 } },
        } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: chiangMaiPlace });

      const processed = await aiProcessingService.processPlace(chiangMaiPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedProvinceId).toBe(3);
      }
    });

    it('should match Phuket province by coordinates', async () => {
      const phuketPlace = {
        ...mockRawPlace1,
        id: 'phuket-1',
        raw_data: {
          ...mockRawPlace1.raw_data,
          geometry: { location: { lat: 7.8958, lng: 98.3015 } },
        } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: phuketPlace });

      const processed = await aiProcessingService.processPlace(phuketPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedProvinceId).toBe(4);
      }
    });

    it('should fallback to Bangkok when coordinates invalid', async () => {
      const invalidPlace = {
        ...mockRawPlace1,
        id: 'invalid-1',
        raw_data: {
          ...mockRawPlace1.raw_data,
          geometry: { location: { lat: 0, lng: 0 } },
        } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: invalidPlace });

      const processed = await aiProcessingService.processPlace(invalidPlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.suggestedProvinceId).toBe(1);
      }
    });
  });

  describe('T031-05: Batch Processing', () => {
    it('should process multiple places successfully', async () => {
      const place2 = { ...mockRawPlace1, id: 'raw-place-2', place_id: 'ChIJ_2' };

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'provinces') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: MOCK_PROVINCES, error: null }),
          };
        }
        if (table === 'google_places_raw') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, value) => ({
              single: jest.fn().mockResolvedValue({
                data: value === 'raw-place-1' ? mockRawPlace1 : place2,
                error: null,
              }),
            })),
          };
        }
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'google_places_import_candidates') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: jest.fn().mockResolvedValue({ data: { id: 'new-candidate' }, error: null }),
          };
        }
        return { select: jest.fn() };
      });

      const result = await aiProcessingService.processPlaces(['raw-place-1', 'raw-place-2']);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.candidatesCreated).toBe(2);
    });

    it('should handle partial failures in batch processing', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'provinces') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: MOCK_PROVINCES, error: null }),
          };
        }
        if (table === 'google_places_raw') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, value) => ({
              single: jest.fn().mockResolvedValue({
                data: value === 'invalid-id' ? null : mockRawPlace1,
                error: value === 'invalid-id' ? { message: 'Not found' } : null,
              }),
            })),
          };
        }
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'google_places_import_candidates') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: jest.fn().mockResolvedValue({ data: { id: 'new-candidate' }, error: null }),
          };
        }
        return { select: jest.fn() };
      });

      const result = await aiProcessingService.processPlaces(['raw-place-1', 'invalid-id', 'raw-place-2']);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should prevent concurrent processing', async () => {
      setupMocks({ rawPlaceData: mockRawPlace1 });

      const promise1 = aiProcessingService.processPlaces(['raw-place-1']);

      await expect(aiProcessingService.processPlaces(['raw-place-1'])).rejects.toThrow(
        'AI processing is already running'
      );

      await promise1;
    });
  });

  describe('T031-06: Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }));

      const result = await aiProcessingService.processPlace('raw-place-1');

      expect(result).toBeNull();
    });

    it('should handle missing raw place data', async () => {
      setupMocks({ rawPlaceData: null });

      const result = await aiProcessingService.processPlace('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle candidate creation failure gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'provinces') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: MOCK_PROVINCES, error: null }),
          };
        }
        if (table === 'google_places_raw') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockRawPlace1, error: null }),
          };
        }
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'google_places_import_candidates') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
          };
        }
        return { select: jest.fn() };
      });

      const result = await aiProcessingService.processPlaces([mockRawPlace1.id]);

      expect(result.successful).toBe(1);
      expect(result.candidatesCreated).toBe(0);
    });

    it('should generate validation warnings for missing data', async () => {
      const incompletePlace = {
        ...mockRawPlace1,
        raw_data: {
          ...mockRawPlace1.raw_data,
          formatted_phone_number: undefined,
          website: undefined,
          rating: 2.5,
        } as GooglePlaceDetails,
      };
      setupMocks({ rawPlaceData: incompletePlace });

      const processed = await aiProcessingService.processPlace(incompletePlace.id);

      expect(processed).not.toBeNull();
      if (processed) {
        expect(processed.validationWarnings).toContain('Missing phone number');
        expect(processed.validationWarnings).toContain('Missing website');
        expect(processed.validationWarnings).toContain('Low or missing rating');
      }
    });
  });
});
