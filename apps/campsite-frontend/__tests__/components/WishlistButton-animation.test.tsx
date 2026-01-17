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

describe('WishlistButton - Animation', () => {
  const mockToggleItem = jest.fn();
  const mockIsInWishlist = jest.fn();

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
      addItem: jest.fn(),
      removeItem: jest.fn(),
      toggleItem: mockToggleItem,
      refreshWishlist: jest.fn(),
      checkBatch: jest.fn(),
    });
  });

  describe('Loading animation', () => {
    it('shows pulse animation on heart icon when loading', async () => {
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

    it('removes pulse animation after loading completes', async () => {
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

    it('applies pulse animation in button variant when loading', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container } = render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      const button = screen.getByLabelText('Save to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Transition animations', () => {
    it('applies transition-all class to heart icon', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });

    it('applies transition-all class when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });

    it('applies transition to button background', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });

    it('maintains transition classes during state changes', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      const updatedIcon = container.querySelector('svg');
      expect(updatedIcon).toHaveClass('transition-all');
    });
  });

  describe('Scale animation on wishlisted state', () => {
    it('applies scale-110 to heart icon when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('scale-110');
    });

    it('does not apply scale-110 when not wishlisted', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('scale-110');
    });

    it('transitions from no scale to scale-110 when toggling to wishlisted', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      let heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('scale-110');

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('scale-110');
    });

    it('removes scale-110 when toggling from wishlisted to not wishlisted', async () => {
      mockIsInWishlist.mockReturnValueOnce(true);
      mockToggleItem.mockResolvedValue(false);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      let heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('scale-110');

      const button = screen.getByLabelText('Remove from wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(false);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('scale-110');
    });
  });

  describe('Hover animations', () => {
    it('applies hover classes to button when not wishlisted', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-white');
    });

    it('applies hover classes to button when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-red-200');
    });

    it('applies hover text color class to heart icon when not wishlisted', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('hover:text-red-500');
    });

    it('does not apply hover text color when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).not.toHaveClass('hover:text-red-500');
    });
  });

  describe('Focus animations', () => {
    it('applies focus ring styles to button', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-green-500');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('maintains focus ring styles when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-green-500');
      expect(button).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Color transitions', () => {
    it('transitions from gray to red when toggling to wishlisted', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      let heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('text-gray-600');
      expect(heartIcon).not.toHaveClass('fill-red-500');

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');
      expect(heartIcon).toHaveClass('text-red-500');
    });

    it('transitions background from white to red when toggling to wishlisted', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      let button = container.querySelector('button');
      expect(button).toHaveClass('bg-white/80');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" />);

      button = container.querySelector('button');
      expect(button).toHaveClass('bg-red-100');
    });
  });

  describe('Animation performance across sizes', () => {
    it('applies same transition classes for small size', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" size="sm" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });

    it('applies same transition classes for medium size', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" size="md" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });

    it('applies same transition classes for large size', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" size="lg" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });
  });

  describe('Animation in button variant', () => {
    it('applies transition classes to heart icon in button variant', () => {
      mockIsInWishlist.mockReturnValue(false);

      const { container } = render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toHaveClass('duration-200');
    });

    it('shows pulse animation in button variant when loading', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container } = render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      const button = screen.getByLabelText('Save to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).toHaveClass('animate-pulse');
      });
    });

    it('applies color transition in button variant when toggling', async () => {
      mockIsInWishlist.mockReturnValueOnce(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      let heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('text-gray-600');

      const button = screen.getByLabelText('Save to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      mockIsInWishlist.mockReturnValue(true);
      rerender(<WishlistButton campsiteId="campsite-123" variant="button" />);

      heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-red-500');
      expect(heartIcon).toHaveClass('text-red-500');
    });
  });

  describe('Animation cleanup', () => {
    it('removes pulse animation when component unmounts during loading', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container, unmount } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).toHaveClass('animate-pulse');
      });

      unmount();

      // Verify component is unmounted without errors
      expect(container.querySelector('svg')).toBeNull();
    });

    it('handles rapid state changes without animation glitches', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);

      const { container, rerender } = render(<WishlistButton campsiteId="campsite-123" />);

      // Rapid rerenders
      for (let i = 0; i < 5; i++) {
        rerender(<WishlistButton campsiteId="campsite-123" />);
      }

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all');
      expect(heartIcon).toBeDefined();
    });
  });
});
