import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SEARCH_DEFAULTS } from '@campsite/shared';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe('useSearch', () => {
  let mockPush: jest.Mock;
  let mockSearchParams: Map<string, string>;
  let mockPathname: string;

  const createMockSearchParams = (params: Record<string, string> = {}) => {
    mockSearchParams = new Map(Object.entries(params));
    return {
      get: (key: string) => mockSearchParams.get(key) || null,
      has: (key: string) => mockSearchParams.has(key),
      toString: () => new URLSearchParams(params).toString(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPush = jest.fn();
    mockPathname = '/search';

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (usePathname as jest.Mock).mockReturnValue(mockPathname);

    // Default: empty search params
    (useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('returns default search params initially', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.filters).toEqual({
        q: undefined,
        provinceId: undefined,
        provinceSlug: undefined,
        types: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        amenities: undefined,
        minRating: undefined,
        sort: SEARCH_DEFAULTS.SORT,
        page: SEARCH_DEFAULTS.PAGE,
      });
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('parses initial values from URL on mount', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          q: 'beachside',
          provinceId: '42',
          province: 'phuket',
          types: 'camping,glamping',
          minPrice: '500',
          maxPrice: '2000',
          amenities: 'wifi,parking',
          minRating: '4.5',
          sort: 'price_asc',
          page: '3',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.filters).toEqual({
        q: 'beachside',
        provinceId: 42,
        provinceSlug: 'phuket',
        types: ['camping', 'glamping'],
        minPrice: 500,
        maxPrice: 2000,
        amenities: ['wifi', 'parking'],
        minRating: 4.5,
        sort: 'price_asc',
        page: 3,
      });
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('handles partial URL params gracefully', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          provinceId: '10',
          sort: 'newest',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.filters).toEqual({
        q: undefined,
        provinceId: 10,
        provinceSlug: undefined,
        types: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        amenities: undefined,
        minRating: undefined,
        sort: 'newest',
        page: SEARCH_DEFAULTS.PAGE,
      });
    });

    it('handles empty array values from URL', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          types: '',
          amenities: '',
        })
      );

      const { result } = renderHook(() => useSearch());

      // Empty strings result in undefined, not empty arrays
      expect(result.current.filters.types).toBeUndefined();
      expect(result.current.filters.amenities).toBeUndefined();
    });
  });

  describe('setProvince', () => {
    it('updates province and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setProvince(15, 'chiang-mai');
      });

      expect(result.current.filters.provinceId).toBe(15);
      expect(result.current.filters.provinceSlug).toBe('chiang-mai');
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?provinceId=15&province=chiang-mai', {
        scroll: false,
      });
    });

    it('clears province when undefined', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          provinceId: '15',
          province: 'chiang-mai',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setProvince(undefined);
      });

      expect(result.current.filters.provinceId).toBeUndefined();
      expect(result.current.filters.provinceSlug).toBeUndefined();

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('resets page to 1 when province changes', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '5',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setProvince(20, 'bangkok');
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('setTypes', () => {
    it('updates types array and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setTypes(['camping', 'glamping', 'cabin']);
      });

      expect(result.current.filters.types).toEqual(['camping', 'glamping', 'cabin']);
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?types=camping%2Cglamping%2Ccabin', {
        scroll: false,
      });
    });

    it('removes types from URL when empty array', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          types: 'camping,glamping',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setTypes([]);
      });

      expect(result.current.filters.types).toBeUndefined();

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('resets page to 1 when types change', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '3',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setTypes(['glamping']);
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('setPriceRange', () => {
    it('updates min/max prices and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPriceRange(1000, 5000);
      });

      expect(result.current.filters.minPrice).toBe(1000);
      expect(result.current.filters.maxPrice).toBe(5000);
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?minPrice=1000&maxPrice=5000', {
        scroll: false,
      });
    });

    it('omits default min price from URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPriceRange(SEARCH_DEFAULTS.MIN_PRICE, 3000);
      });

      expect(mockPush).toHaveBeenCalledWith('/search?maxPrice=3000', { scroll: false });
    });

    it('omits default max price from URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPriceRange(500, SEARCH_DEFAULTS.MAX_PRICE);
      });

      expect(mockPush).toHaveBeenCalledWith('/search?minPrice=500', { scroll: false });
    });

    it('resets page to 1 when price range changes', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '4',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPriceRange(800, 2500);
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('setAmenities', () => {
    it('updates amenities array and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setAmenities(['wifi', 'parking', 'pool']);
      });

      expect(result.current.filters.amenities).toEqual(['wifi', 'parking', 'pool']);
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?amenities=wifi%2Cparking%2Cpool', {
        scroll: false,
      });
    });

    it('removes amenities from URL when empty array', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          amenities: 'wifi,parking',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setAmenities([]);
      });

      expect(result.current.filters.amenities).toBeUndefined();

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('resets page to 1 when amenities change', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '2',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setAmenities(['wifi']);
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('setSort', () => {
    it('updates sort option and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setSort('price_desc');
      });

      expect(result.current.filters.sort).toBe('price_desc');
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?sort=price_desc', { scroll: false });
    });

    it('omits default sort from URL', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          sort: 'newest',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setSort(SEARCH_DEFAULTS.SORT);
      });

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('resets page to 1 when sort changes', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '6',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setSort('newest');
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  describe('setPage', () => {
    it('updates page number and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.filters.page).toBe(5);

      expect(mockPush).toHaveBeenCalledWith('/search?page=5', { scroll: false });
    });

    it('omits default page from URL', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          page: '3',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPage(SEARCH_DEFAULTS.PAGE);
      });

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('preserves other filters when updating page', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          provinceId: '10',
          types: 'camping',
          sort: 'price_asc',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setPage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(
        '/search?provinceId=10&types=camping&sort=price_asc&page=2',
        { scroll: false }
      );
    });
  });

  describe('clearFilters (resetFilters)', () => {
    it('clears all filters and URL', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          q: 'test',
          provinceId: '5',
          province: 'phuket',
          types: 'camping,glamping',
          minPrice: '1000',
          maxPrice: '5000',
          amenities: 'wifi,parking',
          minRating: '4',
          sort: 'price_desc',
          page: '3',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        q: undefined,
        provinceId: undefined,
        provinceSlug: undefined,
        types: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        amenities: undefined,
        minRating: undefined,
        sort: SEARCH_DEFAULTS.SORT,
        page: SEARCH_DEFAULTS.PAGE,
      });

      expect(result.current.hasActiveFilters).toBe(false);

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });

    it('works when no filters are active', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.sort).toBe(SEARCH_DEFAULTS.SORT);
      expect(result.current.filters.page).toBe(SEARCH_DEFAULTS.PAGE);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('URL Query String Persistence', () => {
    it('persists all params correctly in URL query string', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setProvince(10, 'bangkok');
      });

      act(() => {
        result.current.setTypes(['glamping', 'cabin']);
      });

      act(() => {
        result.current.setPriceRange(800, 3000);
      });

      act(() => {
        result.current.setAmenities(['wifi', 'pool']);
      });

      act(() => {
        result.current.setMinRating(4.0);
      });

      act(() => {
        result.current.setSort('newest');
      });

      // Last call should have all accumulated filters
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1];
      expect(lastCall[0]).toContain('provinceId=10');
      expect(lastCall[0]).toContain('province=bangkok');
      expect(lastCall[0]).toContain('types=glamping%2Ccabin');
      expect(lastCall[0]).toContain('minPrice=800');
      expect(lastCall[0]).toContain('maxPrice=3000');
      expect(lastCall[0]).toContain('amenities=wifi%2Cpool');
      expect(lastCall[0]).toContain('minRating=4');
      expect(lastCall[0]).toContain('sort=newest');
    });

    it('maintains filter state across multiple updates', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setTypes(['camping']);
      });

      expect(result.current.filters.types).toEqual(['camping']);

      act(() => {
        result.current.setProvince(5, 'phuket');
      });

      // Types should still be present
      expect(result.current.filters.types).toEqual(['camping']);
      expect(result.current.filters.provinceId).toBe(5);
    });

    it('updates URL without scroll when filters change', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setProvince(1, 'test');
      });

      expect(mockPush).toHaveBeenCalledWith(expect.any(String), { scroll: false });
    });
  });

  describe('setQuery', () => {
    it('updates search query and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('mountain camping');
      });

      expect(result.current.filters.q).toBe('mountain camping');
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?q=mountain+camping', { scroll: false });
    });

    it('clears query when empty string', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          q: 'test',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('');
      });

      expect(result.current.filters.q).toBeUndefined();

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });
  });

  describe('setMinRating', () => {
    it('updates min rating and URL', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setMinRating(4.5);
      });

      expect(result.current.filters.minRating).toBe(4.5);
      expect(result.current.filters.page).toBe(1);

      expect(mockPush).toHaveBeenCalledWith('/search?minRating=4.5', { scroll: false });
    });

    it('clears min rating when undefined', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          minRating: '4',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setMinRating(undefined);
      });

      expect(result.current.filters.minRating).toBeUndefined();

      expect(mockPush).toHaveBeenCalledWith('/search', { scroll: false });
    });
  });

  describe('toggleType', () => {
    it('adds type when not present', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleType('camping');
      });

      expect(result.current.filters.types).toEqual(['camping']);
    });

    it('removes type when already present', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          types: 'camping,glamping',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleType('camping');
      });

      expect(result.current.filters.types).toEqual(['glamping']);
    });

    it('works with empty initial types', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleType('glamping');
      });

      expect(result.current.filters.types).toEqual(['glamping']);
    });
  });

  describe('toggleAmenity', () => {
    it('adds amenity when not present', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleAmenity('wifi');
      });

      expect(result.current.filters.amenities).toEqual(['wifi']);
    });

    it('removes amenity when already present', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          amenities: 'wifi,parking,pool',
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleAmenity('parking');
      });

      expect(result.current.filters.amenities).toEqual(['wifi', 'pool']);
    });

    it('works with empty initial amenities', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.toggleAmenity('pool');
      });

      expect(result.current.filters.amenities).toEqual(['pool']);
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false with no active filters', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('returns true when query is set', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          q: 'search term',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when province is set', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          provinceId: '5',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when types are set', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          types: 'camping',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when price differs from defaults', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          minPrice: '500',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns false when price matches defaults', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          minPrice: String(SEARCH_DEFAULTS.MIN_PRICE),
          maxPrice: String(SEARCH_DEFAULTS.MAX_PRICE),
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('returns true when amenities are set', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          amenities: 'wifi',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when min rating is set', () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        createMockSearchParams({
          minRating: '4',
        })
      );

      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });
});
