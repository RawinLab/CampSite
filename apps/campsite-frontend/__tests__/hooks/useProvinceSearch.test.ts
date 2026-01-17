import { renderHook, waitFor, act } from '@testing-library/react';
import { useProvinceSearch } from '@/hooks/useProvinceSearch';
import type { ProvinceSuggestion } from '@campsite/shared';

// Mock fetch globally
global.fetch = jest.fn();

describe('useProvinceSearch', () => {
  const mockProvinces: ProvinceSuggestion[] = [
    { id: '1', name_en: 'Bangkok', name_th: 'กรุงเทพมหานคร' },
    { id: '2', name_en: 'Chiang Mai', name_th: 'เชียงใหม่' },
    { id: '3', name_en: 'Phuket', name_th: 'ภูเก็ต' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useProvinceSearch());

      expect(result.current.query).toBe('');
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('provides clearSuggestions function', () => {
      const { result } = renderHook(() => useProvinceSearch());

      expect(typeof result.current.clearSuggestions).toBe('function');
    });
  });

  describe('Debouncing', () => {
    it('debounces API calls (waits 300ms before fetching)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      // Set query
      act(() => {
        result.current.setQuery('Ban');
      });

      // Should not fetch immediately
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timers by 299ms (just before debounce completes)
      act(() => {
        jest.advanceTimersByTime(299);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timers by 1ms more (300ms total)
      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('uses custom debounce time when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch({ debounceMs: 500 }));

      act(() => {
        result.current.setQuery('Ban');
      });

      // Advance by 300ms (default debounce time)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should not have fetched yet
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance by additional 200ms (500ms total)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Minimum Character Length', () => {
    it('does not fetch for queries under 2 characters', async () => {
      const { result } = renderHook(() => useProvinceSearch());

      // Single character
      act(() => {
        result.current.setQuery('B');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });

    it('fetches when query reaches minimum length', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('uses custom minimum character length when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch({ minChars: 3 }));

      // Query with 2 characters
      act(() => {
        result.current.setQuery('Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Query with 3 characters
      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('clears suggestions when query becomes too short', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      // Set query and fetch
      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });

      // Reduce query length below minimum
      act(() => {
        result.current.setQuery('B');
      });

      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('API Fetching', () => {
    it('fetches provinces matching the query', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Bangkok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/provinces/autocomplete?q=Bangkok')
        );
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });
    });

    it('includes limit parameter in API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: [] } }),
      });

      const { result } = renderHook(() => useProvinceSearch({ limit: 5 }));

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=5')
        );
      });
    });

    it('properly encodes special characters in query', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: [] } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Bang & Kok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('q=Bang%20%26%20Kok')
        );
      });
    });
  });

  describe('Loading State', () => {
    it('returns loading state while fetching', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the fetch
      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({ data: { data: mockProvinces } }),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets loading to false after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.suggestions).toEqual(mockProvinces);
    });

    it('sets loading to false after failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns error state on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch provinces');
      });

      expect(result.current.suggestions).toEqual([]);
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.suggestions).toEqual([]);
    });

    it('handles non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('String error');

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Search failed');
      });
    });

    it('clears error on successful subsequent fetch', async () => {
      // First request fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch provinces');
      });

      // Second request succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      act(() => {
        result.current.setQuery('Bangkok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });
    });
  });

  describe('Request Cancellation', () => {
    it('cancels previous request when new query typed', async () => {
      const firstFetchCall = jest.fn();
      const secondFetchCall = jest.fn();

      (global.fetch as jest.Mock)
        .mockImplementationOnce(async () => {
          firstFetchCall();
          // Simulate slow response
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            ok: true,
            json: async () => ({ data: { data: [mockProvinces[0]] } }),
          };
        })
        .mockImplementationOnce(async () => {
          secondFetchCall();
          return {
            ok: true,
            json: async () => ({ data: { data: mockProvinces } }),
          };
        });

      const { result } = renderHook(() => useProvinceSearch());

      // First query
      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(firstFetchCall).toHaveBeenCalled();
      });

      // Second query before first completes
      act(() => {
        result.current.setQuery('Bangkok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(secondFetchCall).toHaveBeenCalled();
      });

      // Should only show results from second query
      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });
    });

    it('resets debounce timer when query changes quickly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      // First query
      act(() => {
        result.current.setQuery('Ba');
      });

      // Advance by 200ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Query changes before debounce completes
      act(() => {
        result.current.setQuery('Ban');
      });

      // Advance by another 200ms (400ms total, but debounce should reset)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should not have fetched yet
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance by final 100ms (300ms since last change)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Should fetch with latest query
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Ban')
      );
    });
  });

  describe('Query Updates', () => {
    it('updates results when query changes', async () => {
      const bangkokResults = [mockProvinces[0]];
      const chiangMaiResults = [mockProvinces[1]];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { data: bangkokResults } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { data: chiangMaiResults } }),
        });

      const { result } = renderHook(() => useProvinceSearch());

      // First query
      act(() => {
        result.current.setQuery('Bangkok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(bangkokResults);
      });

      // Second query
      act(() => {
        result.current.setQuery('Chiang');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(chiangMaiResults);
      });
    });
  });

  describe('Clear Suggestions', () => {
    it('clears suggestions when clearSuggestions is called', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: mockProvinces } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Bangkok');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });

      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('API Response Handling', () => {
    it('handles empty API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { data: [] } }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('XYZ');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
      });

      expect(result.current.error).toBeNull();
    });

    it('handles malformed API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
      });
    });

    it('handles nested data structure correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            data: mockProvinces,
            meta: { total: 3 },
          },
        }),
      });

      const { result } = renderHook(() => useProvinceSearch());

      act(() => {
        result.current.setQuery('Ban');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockProvinces);
      });
    });
  });
});
