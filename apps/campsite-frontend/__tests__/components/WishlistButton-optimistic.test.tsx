import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';

// Mock the hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useWishlist');
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseWishlist = useWishlist as jest.MockedFunction<typeof useWishlist>;

describe('WishlistButton - Optimistic Updates', () => {
  const mockToggleItem = jest.fn();
  const mockIsInWishlist = jest.fn();
  const mockAddItem = jest.fn();
  const mockRemoveItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: null,
      role: 'user',
      loading: false,
      error: null,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      refreshSession: jest.fn(),
    });
    mockUseWishlist.mockReturnValue({
      wishlist: [],
      wishlistIds: new Set(),
      isLoading: false,
      error: null,
      count: 0,
      isInWishlist: mockIsInWishlist,
      addItem: mockAddItem,
      removeItem: mockRemoveItem,
      toggleItem: mockToggleItem,
      refreshWishlist: jest.fn(),
      checkBatch: jest.fn(),
    });
  });

  describe('Optimistic UI updates on add', () => {
    it('toggleItem shows optimistic update before API response', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      let resolveToggle: (value: boolean) => void;
      const togglePromise = new Promise<boolean>((resolve) => {
        resolveToggle = resolve;
      });
      mockToggleItem.mockReturnValue(togglePromise);

      const { rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      // Immediately after click, button should be in loading state
      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledWith('campsite-123');
      });

      // Simulate hook updating state optimistically
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // UI should reflect wishlisted state
      expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();

      // Complete the API call
      resolveToggle!(true);

      await waitFor(() => {
        expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
      });
    });

    it('maintains optimistic state during API call', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // Check UI reflects optimistic state
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });
    });
  });

  describe('Optimistic UI updates on remove', () => {
    it('shows optimistic update when removing from wishlist', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      let resolveToggle: (value: boolean) => void;
      const togglePromise = new Promise<boolean>((resolve) => {
        resolveToggle = resolve;
      });
      mockToggleItem.mockReturnValue(togglePromise);

      const { rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledWith('campsite-123');
      });

      // Simulate hook updating state optimistically
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // UI should reflect not wishlisted state
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();

      // Complete the API call
      resolveToggle!(false);

      await waitFor(() => {
        expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
      });
    });

    it('updates heart icon immediately on optimistic remove', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(false), 100)));

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // Check UI reflects optimistic state
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-red-500');
      expect(heartIcon).toHaveClass('text-gray-600');

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });
    });
  });

  describe('Rollback on error', () => {
    it('rolls back optimistic update when add fails', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Simulate rollback
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // UI should roll back to original state
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
    });

    it('rolls back heart icon fill when add fails', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      let heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Simulate rollback
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-red-500');
      expect(heartIcon).toHaveClass('text-gray-600');
    });

    it('rolls back optimistic update when remove fails', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Simulate rollback
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      // UI should roll back to wishlisted state
      expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
    });

    it('rolls back button background when remove fails', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      // Simulate optimistic update
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Simulate rollback
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      const rolledBackButton = container.querySelector('button');
      expect(rolledBackButton).toHaveClass('bg-red-100');
    });

    it('maintains correct state after multiple failed attempts', async () => {
      mockIsInWishlist.mockReturnValue(false);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      // First attempt
      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledTimes(1);
      });

      rerender(<WishlistButton campsiteId="campsite-123" />);
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();

      // Second attempt
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledTimes(2);
      });

      rerender(<WishlistButton campsiteId="campsite-123" />);
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
    });
  });

  describe('Optimistic update lifecycle', () => {
    it('completes full optimistic update cycle on successful add', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      // Initial state - not wishlisted
      let heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-red-500');

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      // Optimistic update - immediately show wishlisted
      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');

      // Wait for API to complete
      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Final state - still wishlisted
      rerender(<WishlistButton campsiteId="campsite-123" />);
      expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
    });

    it('completes full optimistic update cycle on successful remove', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      mockToggleItem.mockResolvedValue(false);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      // Initial state - wishlisted
      let heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      // Optimistic update - immediately show not wishlisted
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-red-500');

      // Wait for API to complete
      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // Final state - still not wishlisted
      rerender(<WishlistButton campsiteId="campsite-123" />);
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
    });
  });

  describe('Optimistic updates with onToggle callback', () => {
    it('calls onToggle with optimistic state on successful add', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);
      const onToggle = jest.fn();

      render(<WishlistButton campsiteId="campsite-123" onToggle={onToggle} />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onToggle).toHaveBeenCalledWith(true);
      });
    });

    it('calls onToggle with optimistic state on successful remove', async () => {
      mockIsInWishlist.mockReturnValue(true);
      mockToggleItem.mockResolvedValue(false);
      const onToggle = jest.fn();

      render(<WishlistButton campsiteId="campsite-123" onToggle={onToggle} />);

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onToggle).toHaveBeenCalledWith(false);
      });
    });

    it('does not call onToggle when operation fails', async () => {
      mockIsInWishlist.mockReturnValue(false);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();
      const onToggle = jest.fn();

      render(<WishlistButton campsiteId="campsite-123" onToggle={onToggle} />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('calls onToggle only once per successful operation', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);
      const onToggle = jest.fn();

      render(<WishlistButton campsiteId="campsite-123" onToggle={onToggle} />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onToggle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Visual feedback during optimistic updates', () => {
    it('shows loading indicator during optimistic update', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).toHaveClass('animate-pulse');
      });
    });

    it('removes loading indicator after optimistic update completes', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).not.toHaveClass('animate-pulse');
      });
    });

    it('maintains visual state consistency during rollback', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      // After rollback, visual state should match data state
      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-red-500');
      const buttonElement = container.querySelector('button');
      expect(buttonElement).toHaveClass('bg-white/80');
    });
  });

  describe('Concurrent optimistic updates', () => {
    it('handles rapid toggle attempts gracefully', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');

      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only trigger one request
      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents new optimistic updates while one is in progress', async () => {
      mockIsInWishlist.mockReturnValue(false);
      let resolveToggle: (value: boolean) => void;
      const togglePromise = new Promise<boolean>((resolve) => {
        resolveToggle = resolve;
      });
      mockToggleItem.mockReturnValue(togglePromise);

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');

      fireEvent.click(button);
      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledTimes(1);
      });

      // Try to click again while loading
      fireEvent.click(button);

      // Should not trigger another request
      expect(mockToggleItem).toHaveBeenCalledTimes(1);

      // Complete the first request
      resolveToggle!(true);
    });
  });
});
