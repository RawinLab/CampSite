/**
 * @jest-environment jsdom
 */

import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  batchCheckWishlist,
  getWishlistCount,
} from '@/lib/api/wishlist';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Wishlist API Client', () => {
  const mockAccessToken = 'mock-access-token';
  const API_BASE_URL = 'http://localhost:3001';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase auth session
    mockCreateClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: mockAccessToken,
            },
          },
        }),
      },
    } as any);

    // Set default environment variable
    process.env.NEXT_PUBLIC_API_URL = API_BASE_URL;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('fetchWishlist', () => {
    const mockWishlistResponse = {
      success: true,
      data: {
        items: [
          {
            id: 'wishlist-1',
            user_id: 'user-123',
            campsite_id: 'campsite-1',
            notes: 'Great campsite',
            created_at: '2025-01-01T00:00:00Z',
            campsite: {
              id: 'campsite-1',
              name: 'Mountain View Camp',
              slug: 'mountain-view-camp',
            },
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          pages: 1,
        },
      },
    };

    it('should fetch wishlist with default parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWishlistResponse),
      } as any);

      const result = await fetchWishlist();

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/wishlist?page=1&limit=20&sort=newest`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      );
      expect(result).toEqual(mockWishlistResponse);
    });

    it('should fetch wishlist with custom parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWishlistResponse),
      } as any);

      await fetchWishlist(2, 10, 'oldest');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/wishlist?page=2&limit=10&sort=oldest`,
        expect.any(Object)
      );
    });

    it('should fetch wishlist sorted by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWishlistResponse),
      } as any);

      await fetchWishlist(1, 20, 'name');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/wishlist?page=1&limit=20&sort=name`,
        expect.any(Object)
      );
    });

    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWishlistResponse),
      } as any);

      await fetchWishlist();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error when API request fails', async () => {
      const errorResponse = { error: 'Unauthorized' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(fetchWishlist()).rejects.toThrow('Unauthorized');
    });

    it('should throw default error when error response has no error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await expect(fetchWishlist()).rejects.toThrow('Failed to fetch wishlist');
    });

    it('should throw default error when error response parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any);

      await expect(fetchWishlist()).rejects.toThrow('Failed to fetch wishlist');
    });

    it('should work without authorization header when no session', async () => {
      mockCreateClient.mockReturnValueOnce({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWishlistResponse),
      } as any);

      await fetchWishlist();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('addToWishlist', () => {
    const mockAddResponse = {
      success: true,
      data: {
        id: 'wishlist-1',
        user_id: 'user-123',
        campsite_id: 'campsite-1',
        notes: 'Must visit',
        created_at: '2025-01-01T00:00:00Z',
      },
    };

    it('should add campsite to wishlist without notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAddResponse),
      } as any);

      const result = await addToWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          campsite_id: 'campsite-1',
          notes: undefined,
        }),
      });
      expect(result).toEqual(mockAddResponse);
    });

    it('should add campsite to wishlist with notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAddResponse),
      } as any);

      await addToWishlist('campsite-1', 'Must visit');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            campsite_id: 'campsite-1',
            notes: 'Must visit',
          }),
        })
      );
    });

    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAddResponse),
      } as any);

      await addToWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should use POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAddResponse),
      } as any);

      await addToWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when API request fails', async () => {
      const errorResponse = { error: 'Campsite already in wishlist' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(addToWishlist('campsite-1')).rejects.toThrow('Campsite already in wishlist');
    });

    it('should throw default error when error response has no error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await expect(addToWishlist('campsite-1')).rejects.toThrow('Failed to add to wishlist');
    });

    it('should throw default error when error response parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any);

      await expect(addToWishlist('campsite-1')).rejects.toThrow('Failed to add to wishlist');
    });
  });

  describe('removeFromWishlist', () => {
    const mockRemoveResponse = {
      success: true,
      message: 'Campsite removed from wishlist',
    };

    it('should remove campsite from wishlist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRemoveResponse),
      } as any);

      const result = await removeFromWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/wishlist/campsite-1`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
      expect(result).toEqual(mockRemoveResponse);
    });

    it('should use DELETE method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRemoveResponse),
      } as any);

      await removeFromWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should include campsite ID in URL path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRemoveResponse),
      } as any);

      await removeFromWishlist('test-campsite-123');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/wishlist/test-campsite-123`,
        expect.any(Object)
      );
    });

    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRemoveResponse),
      } as any);

      await removeFromWishlist('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error when API request fails', async () => {
      const errorResponse = { error: 'Campsite not found in wishlist' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(removeFromWishlist('campsite-1')).rejects.toThrow('Campsite not found in wishlist');
    });

    it('should throw default error when error response has no error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await expect(removeFromWishlist('campsite-1')).rejects.toThrow('Failed to remove from wishlist');
    });

    it('should throw default error when error response parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any);

      await expect(removeFromWishlist('campsite-1')).rejects.toThrow('Failed to remove from wishlist');
    });
  });

  describe('checkWishlistStatus', () => {
    const mockStatusResponse = {
      success: true,
      data: {
        in_wishlist: true,
      },
    };

    it('should check if campsite is in wishlist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatusResponse),
      } as any);

      const result = await checkWishlistStatus('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/wishlist/check/campsite-1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
      expect(result).toEqual(mockStatusResponse);
    });

    it('should use GET method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatusResponse),
      } as any);

      await checkWishlistStatus('campsite-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include campsite ID in URL path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatusResponse),
      } as any);

      await checkWishlistStatus('test-campsite-456');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/wishlist/check/test-campsite-456`,
        expect.any(Object)
      );
    });

    it('should throw error when API request fails', async () => {
      const errorResponse = { error: 'Unauthorized' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(checkWishlistStatus('campsite-1')).rejects.toThrow('Unauthorized');
    });

    it('should throw default error when error response parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any);

      await expect(checkWishlistStatus('campsite-1')).rejects.toThrow('Failed to check wishlist status');
    });
  });

  describe('batchCheckWishlist', () => {
    const mockBatchResponse = {
      success: true,
      data: {
        'campsite-1': true,
        'campsite-2': false,
        'campsite-3': true,
      },
    };

    it('should check multiple campsites in batch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBatchResponse),
      } as any);

      const campsiteIds = ['campsite-1', 'campsite-2', 'campsite-3'];
      const result = await batchCheckWishlist(campsiteIds);

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/wishlist/check-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({ campsite_ids: campsiteIds }),
      });
      expect(result).toEqual(mockBatchResponse);
    });

    it('should use POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBatchResponse),
      } as any);

      await batchCheckWishlist(['campsite-1']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should send campsite IDs in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBatchResponse),
      } as any);

      const campsiteIds = ['id-1', 'id-2', 'id-3', 'id-4'];
      await batchCheckWishlist(campsiteIds);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ campsite_ids: campsiteIds }),
        })
      );
    });

    it('should handle empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: {} }),
      } as any);

      await batchCheckWishlist([]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ campsite_ids: [] }),
        })
      );
    });

    it('should throw error when API request fails', async () => {
      const errorResponse = { error: 'Invalid campsite IDs' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(batchCheckWishlist(['campsite-1'])).rejects.toThrow('Invalid campsite IDs');
    });

    it('should throw default error when error response parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any);

      await expect(batchCheckWishlist(['campsite-1'])).rejects.toThrow('Failed to check wishlist status');
    });
  });

  describe('getWishlistCount', () => {
    it('should return wishlist count', async () => {
      const mockCountResponse = {
        success: true,
        data: {
          count: 5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCountResponse),
      } as any);

      const result = await getWishlistCount();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/wishlist/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
      expect(result).toBe(5);
    });

    it('should use GET method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: { count: 0 } }),
      } as any);

      await getWishlistCount();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return 0 when count is missing in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: {} }),
      } as any);

      const result = await getWishlistCount();

      expect(result).toBe(0);
    });

    it('should return 0 when data is missing in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as any);

      const result = await getWishlistCount();

      expect(result).toBe(0);
    });

    it('should return 0 when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      } as any);

      const result = await getWishlistCount();

      expect(result).toBe(0);
    });

    it('should return 0 on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getWishlistCount();

      expect(result).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response parsing', () => {
    it('should correctly parse JSON response for fetchWishlist', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 20, pages: 0 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await fetchWishlist();

      expect(result).toEqual(mockResponse);
    });

    it('should correctly parse JSON response for addToWishlist', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'wishlist-1',
          user_id: 'user-123',
          campsite_id: 'campsite-1',
          notes: null,
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await addToWishlist('campsite-1');

      expect(result).toEqual(mockResponse);
    });

    it('should correctly parse JSON response for removeFromWishlist', async () => {
      const mockResponse = {
        success: true,
        message: 'Removed',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await removeFromWishlist('campsite-1');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchWishlist()).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(addToWishlist('campsite-1')).rejects.toThrow('Request timeout');
    });

    it('should handle server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      } as any);

      await expect(removeFromWishlist('campsite-1')).rejects.toThrow('Internal server error');
    });

    it('should handle client errors (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Invalid request' }),
      } as any);

      await expect(addToWishlist('')).rejects.toThrow('Invalid request');
    });

    it('should handle unauthorized errors (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      } as any);

      await expect(fetchWishlist()).rejects.toThrow('Unauthorized');
    });

    it('should handle forbidden errors (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({ error: 'Forbidden' }),
      } as any);

      await expect(checkWishlistStatus('campsite-1')).rejects.toThrow('Forbidden');
    });
  });
});
