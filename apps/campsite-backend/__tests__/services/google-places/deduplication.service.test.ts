// Mock dependencies BEFORE importing the service
jest.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../../src/lib/supabase';
import DeduplicationService from '../../../src/services/google-places/deduplication.service';

describe('DeduplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectDuplicate', () => {
    it('detects duplicate with name match', async () => {
      const mockCampsites = [
        {
          id: 'campsite-1',
          name: 'Sunset Camping Ground',
          address: '123 Mountain Road, Chiang Mai',
          distance_km: 0,
        },
      ];

      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        data: mockCampsites,
        error: null,
      });

      const result = await DeduplicationService.detectDuplicate(
        'Sunset Camping Ground',
        '123 Mountain Road, Chiang Mai',
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOfCampsiteId).toBe('campsite-1');
      expect(result.similarityScore).toBeGreaterThan(0.8);
      expect(result.similarCampsites).toHaveLength(1);
    });

    it('detects duplicate with location proximity', async () => {
      const mockCampsites = [
        {
          id: 'campsite-2',
          name: 'Mountain View Camp',
          address: 'Near Mountain View Point',
          latitude: 18.7883,
          longitude: 98.9853,
        },
      ];

      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      (supabaseAdmin.limit as jest.Mock).mockResolvedValue({
        data: mockCampsites,
        error: null,
      });

      const result = await DeduplicationService.detectDuplicate(
        'Different Camp Name',
        'Different Address',
        undefined,
        undefined,
        18.7883, // Same coordinates
        98.9853
      );

      expect(result.similarCampsites.length).toBeGreaterThan(0);
      expect(result.similarCampsites[0].distanceKm).toBeLessThan(0.5);
    });

    it('detects duplicate with phone match', async () => {
      const mockCampsite = {
        id: 'campsite-3',
        name: 'River Camp',
        address: '456 River Road',
        phone: '081-234-5678',
      };

      // Mock RPC for name search (no matches)
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock location search (no matches from .from().select().eq().limit())
      (supabaseAdmin.limit as jest.Mock)
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        // Mock phone search (has match)
        .mockResolvedValueOnce({
          data: [mockCampsite],
          error: null,
        });

      const result = await DeduplicationService.detectDuplicate(
        'Different Name',
        'Different Address',
        '0812345678', // Same phone, different format
        undefined,
        undefined,
        undefined
      );

      // Phone match gives confidence of 1.0, but threshold for duplicate is >0.8
      expect(result.similarCampsites.length).toBeGreaterThan(0);
      expect(result.similarCampsites[0].similarityScore).toBe(1);
      expect(result.similarCampsites[0].campsiteId).toBe('campsite-3');
    });

    it('detects duplicate with website match', async () => {
      const mockCampsite = {
        id: 'campsite-4',
        name: 'Beach Camp',
        address: '789 Beach Road',
        website: 'https://www.beachcamp.com',
      };

      // Mock RPC for name search (no matches)
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock location search (no matches)
      (supabaseAdmin.limit as jest.Mock)
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        // Mock phone search (no matches)
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        // Mock website search (has match)
        .mockResolvedValueOnce({
          data: [mockCampsite],
          error: null,
        });

      const result = await DeduplicationService.detectDuplicate(
        'Different Name',
        'Different Address',
        undefined,
        'http://beachcamp.com', // Same website, different protocol/www
        undefined,
        undefined
      );

      // Website match gives confidence of 1.0
      expect(result.similarCampsites.length).toBeGreaterThan(0);
      expect(result.similarCampsites[0].similarityScore).toBe(1);
      expect(result.similarCampsites[0].campsiteId).toBe('campsite-4');
    });
  });

  describe('calculateSimilarity', () => {
    it('returns correct score for exact match', () => {
      // Access through detectDuplicate with matching data
      const service = DeduplicationService as any;

      const similarity = service.calculateSimilarity(
        'Sunset Camp',
        '123 Mountain Road',
        {
          name: 'Sunset Camp',
          address: '123 Mountain Road',
          distance_km: 0.05, // Very close
        }
      );

      expect(similarity).toBeGreaterThan(0.9);
    });

    it('returns low score for different places', () => {
      const service = DeduplicationService as any;

      const similarity = service.calculateSimilarity(
        'Sunset Camp',
        '123 Mountain Road',
        {
          name: 'Beach Resort',
          address: '789 Beach Street, Phuket',
          distance_km: 50, // Far away
        }
      );

      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('haversineDistance', () => {
    it('calculates distance correctly', () => {
      const service = DeduplicationService as any;

      // Bangkok to Chiang Mai (approximate)
      const distance = service.haversineDistance(
        13.7563, // Bangkok lat
        100.5018, // Bangkok lng
        18.7883, // Chiang Mai lat
        98.9853 // Chiang Mai lng
      );

      // Distance should be around 580-600 km
      expect(distance).toBeGreaterThan(580);
      expect(distance).toBeLessThan(620);
    });

    it('returns zero for same coordinates', () => {
      const service = DeduplicationService as any;

      const distance = service.haversineDistance(
        13.7563,
        100.5018,
        13.7563,
        100.5018
      );

      expect(distance).toBeCloseTo(0, 2);
    });
  });

  describe('stringSimilarity', () => {
    it('returns 1 for identical strings', () => {
      const service = DeduplicationService as any;

      const similarity = service.stringSimilarity('Sunset Camp', 'Sunset Camp');

      expect(similarity).toBe(1);
    });

    it('returns 0.8 for substring match', () => {
      const service = DeduplicationService as any;

      const similarity = service.stringSimilarity('Sunset', 'Sunset Camp');

      expect(similarity).toBe(0.8);
    });

    it('returns value between 0-1 for partial match', () => {
      const service = DeduplicationService as any;

      const similarity = service.stringSimilarity('Sunset Camp', 'Beach Camp');

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('returns 0 for empty strings', () => {
      const service = DeduplicationService as any;

      const similarity = service.stringSimilarity('', 'Sunset Camp');

      expect(similarity).toBe(0);
    });
  });
});
