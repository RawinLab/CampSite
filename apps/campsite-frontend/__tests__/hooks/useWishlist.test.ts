import { renderHook, waitFor, act } from '@testing-library/react';
import { useWishlist, useWishlistCount } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchWishlist,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
  batchCheckWishlist,
  getWishlistCount,
} from '@/lib/api/wishlist';
import type { WishlistItemWithCampsite } from '@campsite/shared';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/api/wishlist');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetchWishlist = fetchWishlist as jest.MockedFunction<typeof fetchWishlist>;
const mockAddToWishlistApi = addToWishlistApi as jest.MockedFunction<typeof addToWishlistApi>;
const mockRemoveFromWishlistApi = removeFromWishlistApi as jest.MockedFunction<typeof removeFromWishlistApi>;
const mockBatchCheckWishlist = batchCheckWishlist as jest.MockedFunction<typeof batchCheckWishlist>;
const mockGetWishlistCount = getWishlistCount as jest.MockedFunction<typeof getWishlistCount>;

describe('useWishlist', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as const,
  };

  const mockWishlistItems: WishlistItemWithCampsite[] = [
    {
      id: 'wishlist-1',
      user_id: 'user-123',
      campsite_id: 'campsite-1',
      created_at: '2024-01-01T00:00:00Z',
      campsite: {
        id: 'campsite-1',
        name: 'Mountain View Camping',
        province_name_en: 'Chiang Mai',
        campsite_type: 'camping',
        average_rating: 4.5,
        review_count: 120,
        min_price: 300,
        max_price: 500,
        primary_photo_url: 'https://example.com/photo1.jpg',
      },
    },
    {
      id: 'wishlist-2',
      user_id: 'user-123',
      campsite_id: 'campsite-2',
      created_at: '2024-01-02T00:00:00Z',
      campsite: {
        id: 'campsite-2',
        name: 'Beachside Glamping',
        province_name_en: 'Phuket',
        campsite_type: 'glamping',
        average_rating: 4.8,
        review_count: 85,
        min_price: 800,
        max_price: 1200,
        primary_photo_url: 'https://example.com/photo2.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      session: null,
    });

    mockFetchWishlist.mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });
  });

  describe('Initial State', () => {
    it('returns initial state correctly when not authenticated', async () => {
      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.wishlist).toEqual([]);
      expect(result.current.wishlistIds).toEqual(new Set());
      expect(result.current.error).toBeNull();
      expect(result.current.count).toBe(0);
      expect(typeof result.current.isInWishlist).toBe('function');
      expect(typeof result.current.addItem).toBe('function');
      expect(typeof result.current.removeItem).toBe('function');
      expect(typeof result.current.toggleItem).toBe('function');
      expect(typeof result.current.refreshWishlist).toBe('function');
      expect(typeof result.current.checkBatch).toBe('function');
    });

    it('loads wishlist when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.wishlist).toEqual(mockWishlistItems);
      expect(result.current.wishlistIds).toEqual(new Set(['campsite-1', 'campsite-2']));
      expect(result.current.count).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it('does not fetch wishlist while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      renderHook(() => useWishlist());

      expect(mockFetchWishlist).not.toHaveBeenCalled();
    });

    it('fetches wishlist after auth loading completes', async () => {
      const { rerender } = renderHook(() => useWishlist());

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      rerender();

      await waitFor(() => {
        expect(mockFetchWishlist).toHaveBeenCalledWith(1, 100, 'newest');
      });
    });
  });

  describe('Loading State', () => {
    it('sets loading state during initial fetch', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchWishlist.mockReturnValue(promise as any);

      const { result } = renderHook(() => useWishlist());

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolvePromise!({
          data: mockWishlistItems,
          count: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('clears loading state after successful fetch', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.wishlist).toEqual(mockWishlistItems);
      expect(result.current.error).toBeNull();
    });

    it('clears loading state after failed fetch', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const error = new Error('Failed to fetch wishlist');
      mockFetchWishlist.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.wishlist).toEqual([]);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors and sets error state', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const error = new Error('Network error');
      mockFetchWishlist.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      expect(result.current.isLoading).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load wishlist:', error);

      consoleErrorSpy.mockRestore();
    });

    it('clears error on successful refetch', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const error = new Error('Network error');
      mockFetchWishlist.mockRejectedValueOnce(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      await act(async () => {
        await result.current.refreshWishlist();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.wishlist).toEqual(mockWishlistItems);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isInWishlist', () => {
    it('returns true for items in wishlist', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInWishlist('campsite-1')).toBe(true);
      expect(result.current.isInWishlist('campsite-2')).toBe(true);
    });

    it('returns false for items not in wishlist', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInWishlist('campsite-999')).toBe(false);
    });
  });

  describe('addItem', () => {
    it('throws error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.addItem('campsite-1')).rejects.toThrow(
        'Please log in to save to wishlist'
      );
    });

    it('performs optimistic update when adding item', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
      expect(result.current.isInWishlist('campsite-1')).toBe(false);

      mockAddToWishlistApi.mockResolvedValue({ success: true });
      mockFetchWishlist.mockResolvedValue({
        data: [mockWishlistItems[0]],
        count: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      await act(async () => {
        await result.current.addItem('campsite-1');
      });

      await waitFor(() => {
        expect(result.current.count).toBe(1);
      });

      expect(result.current.isInWishlist('campsite-1')).toBe(true);
      expect(mockAddToWishlistApi).toHaveBeenCalledWith('campsite-1');
    });

    it('reverts optimistic update on error', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('API error');
      mockAddToWishlistApi.mockRejectedValue(error);

      await expect(
        act(async () => {
          await result.current.addItem('campsite-1');
        })
      ).rejects.toThrow('API error');

      expect(result.current.isInWishlist('campsite-1')).toBe(false);
      expect(result.current.count).toBe(0);
    });

    it('refreshes wishlist after successful add', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockAddToWishlistApi.mockResolvedValue({ success: true });
      mockFetchWishlist.mockResolvedValue({
        data: [mockWishlistItems[0]],
        count: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      await act(async () => {
        await result.current.addItem('campsite-1');
      });

      await waitFor(() => {
        expect(mockFetchWishlist).toHaveBeenCalledTimes(2);
      });

      expect(result.current.wishlist).toEqual([mockWishlistItems[0]]);
    });
  });

  describe('removeItem', () => {
    it('throws error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.removeItem('campsite-1')).rejects.toThrow(
        'Please log in to manage wishlist'
      );
    });

    it('performs optimistic update when removing item', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(2);
      expect(result.current.isInWishlist('campsite-1')).toBe(true);

      mockRemoveFromWishlistApi.mockResolvedValue({ success: true });

      await act(async () => {
        await result.current.removeItem('campsite-1');
      });

      expect(result.current.isInWishlist('campsite-1')).toBe(false);
      expect(result.current.count).toBe(1);
      expect(result.current.wishlist).toHaveLength(1);
      expect(mockRemoveFromWishlistApi).toHaveBeenCalledWith('campsite-1');
    });

    it('reverts optimistic update on error', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('API error');
      mockRemoveFromWishlistApi.mockRejectedValue(error);

      await expect(
        act(async () => {
          await result.current.removeItem('campsite-1');
        })
      ).rejects.toThrow('API error');

      expect(result.current.isInWishlist('campsite-1')).toBe(true);
      expect(result.current.count).toBe(2);
      expect(result.current.wishlist).toEqual(mockWishlistItems);
    });

    it('prevents count from going below zero', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [mockWishlistItems[0]],
        count: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockRemoveFromWishlistApi.mockResolvedValue({ success: true });

      await act(async () => {
        await result.current.removeItem('campsite-1');
      });

      expect(result.current.count).toBe(0);
    });
  });

  describe('toggleItem', () => {
    it('adds item when not in wishlist', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockAddToWishlistApi.mockResolvedValue({ success: true });
      mockFetchWishlist.mockResolvedValue({
        data: [mockWishlistItems[0]],
        count: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      let toggleResult: boolean = false;
      await act(async () => {
        toggleResult = await result.current.toggleItem('campsite-1');
      });

      expect(toggleResult).toBe(true);
      expect(mockAddToWishlistApi).toHaveBeenCalledWith('campsite-1');
    });

    it('removes item when already in wishlist', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockRemoveFromWishlistApi.mockResolvedValue({ success: true });

      let toggleResult: boolean = true;
      await act(async () => {
        toggleResult = await result.current.toggleItem('campsite-1');
      });

      expect(toggleResult).toBe(false);
      expect(mockRemoveFromWishlistApi).toHaveBeenCalledWith('campsite-1');
    });

    it('returns new wishlist state', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockAddToWishlistApi.mockResolvedValue({ success: true });
      mockFetchWishlist.mockResolvedValue({
        data: [mockWishlistItems[0]],
        count: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      let addResult: boolean = false;
      await act(async () => {
        addResult = await result.current.toggleItem('campsite-1');
      });

      expect(addResult).toBe(true);

      mockRemoveFromWishlistApi.mockResolvedValue({ success: true });

      let removeResult: boolean = true;
      await act(async () => {
        removeResult = await result.current.toggleItem('campsite-1');
      });

      expect(removeResult).toBe(false);
    });
  });

  describe('checkBatch', () => {
    it('returns empty object for empty array', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let batchResult: Record<string, boolean> = {};
      await act(async () => {
        batchResult = await result.current.checkBatch([]);
      });

      expect(batchResult).toEqual({});
      expect(mockBatchCheckWishlist).not.toHaveBeenCalled();
    });

    it('returns all false when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const campsiteIds = ['campsite-1', 'campsite-2', 'campsite-3'];

      let batchResult: Record<string, boolean> = {};
      await act(async () => {
        batchResult = await result.current.checkBatch(campsiteIds);
      });

      expect(batchResult).toEqual({
        'campsite-1': false,
        'campsite-2': false,
        'campsite-3': false,
      });
      expect(mockBatchCheckWishlist).not.toHaveBeenCalled();
    });

    it('calls batch check API for authenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const campsiteIds = ['campsite-1', 'campsite-2', 'campsite-3'];
      const batchResponse = {
        'campsite-1': true,
        'campsite-2': false,
        'campsite-3': true,
      };

      mockBatchCheckWishlist.mockResolvedValue({ data: batchResponse });

      let batchResult: Record<string, boolean> = {};
      await act(async () => {
        batchResult = await result.current.checkBatch(campsiteIds);
      });

      expect(batchResult).toEqual(batchResponse);
      expect(mockBatchCheckWishlist).toHaveBeenCalledWith(campsiteIds);
    });

    it('returns all false on API error', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const campsiteIds = ['campsite-1', 'campsite-2'];
      mockBatchCheckWishlist.mockRejectedValue(new Error('API error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      let batchResult: Record<string, boolean> = {};
      await act(async () => {
        batchResult = await result.current.checkBatch(campsiteIds);
      });

      expect(batchResult).toEqual({
        'campsite-1': false,
        'campsite-2': false,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refreshWishlist', () => {
    it('refetches wishlist data', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const { result } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.wishlist).toEqual([]);

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      await act(async () => {
        await result.current.refreshWishlist();
      });

      await waitFor(() => {
        expect(result.current.wishlist).toEqual(mockWishlistItems);
      });

      expect(result.current.count).toBe(2);
    });
  });

  describe('User state changes', () => {
    it('clears wishlist when user logs out', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const { result, rerender } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.wishlist).toEqual(mockWishlistItems);
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.wishlist).toEqual([]);
      });

      expect(result.current.wishlistIds).toEqual(new Set());
      expect(result.current.count).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('loads wishlist when user logs in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result, rerender } = renderHook(() => useWishlist());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.wishlist).toEqual([]);

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockFetchWishlist.mockResolvedValue({
        data: mockWishlistItems,
        count: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.wishlist).toEqual(mockWishlistItems);
      });

      expect(result.current.count).toBe(2);
    });
  });
});

describe('useWishlistCount', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      session: null,
    });
  });

  describe('Initial State', () => {
    it('returns zero count when not authenticated', async () => {
      const { result } = renderHook(() => useWishlistCount());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
    });

    it('fetches count when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockGetWishlistCount.mockResolvedValue(5);

      const { result } = renderHook(() => useWishlistCount());

      await waitFor(() => {
        expect(result.current.count).toBe(5);
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockGetWishlistCount).toHaveBeenCalled();
    });

    it('does not fetch count while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      renderHook(() => useWishlistCount());

      expect(mockGetWishlistCount).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('sets loading state during fetch', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      let resolvePromise: (value: number) => void;
      const promise = new Promise<number>((resolve) => {
        resolvePromise = resolve;
      });

      mockGetWishlistCount.mockReturnValue(promise);

      const { result } = renderHook(() => useWishlistCount());

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolvePromise!(10);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('returns zero count on error', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockGetWishlistCount.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useWishlistCount());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
    });
  });

  describe('User state changes', () => {
    it('clears count when user logs out', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockGetWishlistCount.mockResolvedValue(8);

      const { result, rerender } = renderHook(() => useWishlistCount());

      await waitFor(() => {
        expect(result.current.count).toBe(8);
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.count).toBe(0);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('fetches count when user logs in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      const { result, rerender } = renderHook(() => useWishlistCount());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
        session: null,
      });

      mockGetWishlistCount.mockResolvedValue(12);

      rerender();

      await waitFor(() => {
        expect(result.current.count).toBe(12);
      });

      expect(mockGetWishlistCount).toHaveBeenCalled();
    });
  });
});
