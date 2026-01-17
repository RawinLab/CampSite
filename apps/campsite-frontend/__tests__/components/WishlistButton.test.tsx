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

describe('WishlistButton', () => {
  const mockToggleItem = jest.fn();
  const mockIsInWishlist = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('Icon rendering - not wishlisted', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('renders heart icon in outline state when not wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toBeInTheDocument();
      expect(heartIcon).not.toHaveClass('fill-red-500');
    });

    it('renders heart icon with gray color when not wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('text-gray-600');
    });

    it('renders button with white background when not wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-white/80');
    });

    it('shows "Add to wishlist" aria-label when not wishlisted', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Icon rendering - wishlisted', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(true);
    });

    it('renders heart icon in filled state when wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toBeInTheDocument();
      expect(heartIcon).toHaveClass('fill-red-500');
      expect(heartIcon).toHaveClass('text-red-500');
    });

    it('renders button with red background when wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-red-100');
    });

    it('shows "Remove from wishlist" aria-label when wishlisted', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Remove from wishlist');
      expect(button).toBeInTheDocument();
    });

    it('applies scale-110 class to heart icon when wishlisted', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('scale-110');
    });
  });

  describe('Click toggle functionality', () => {
    beforeEach(() => {
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
    });

    it('calls toggleItem when clicked', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledWith('campsite-123');
      });
    });

    it('prevents event propagation when clicked', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);

      const handleParentClick = jest.fn();
      const { container } = render(
        <div onClick={handleParentClick}>
          <WishlistButton campsiteId="campsite-123" />
        </div>
      );

      const button = container.querySelector('button');
      fireEvent.click(button!);

      expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('prevents default event when clicked', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockResolvedValue(true);

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(button, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('calls onToggle callback with new state when provided', async () => {
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

    it('does not call toggleItem when already loading', async () => {
      mockIsInWishlist.mockReturnValue(false);
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call toggleItem when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        role: 'user',
        loading: true,
        error: null,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        refreshSession: jest.fn(),
      });
      mockIsInWishlist.mockReturnValue(false);

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      expect(mockToggleItem).not.toHaveBeenCalled();
    });
  });

  describe('Login prompt for unauthenticated users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('shows login prompt when unauthenticated user clicks', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      expect(screen.getByText('Please log in to save campsites to your wishlist.')).toBeInTheDocument();
    });

    it('does not call toggleItem when unauthenticated', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      expect(mockToggleItem).not.toHaveBeenCalled();
    });

    it('displays login link in prompt', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      const loginLink = screen.getByRole('link', { name: 'Log in' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });

    it('displays cancel button in prompt', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();
    });

    it('closes login prompt when cancel is clicked', () => {
      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Please log in to save campsites to your wishlist.')).not.toBeInTheDocument();
    });

    it('auto-hides login prompt after 3 seconds', async () => {
      jest.useFakeTimers();

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      expect(screen.getByText('Please log in to save campsites to your wishlist.')).toBeInTheDocument();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText('Please log in to save campsites to your wishlist.')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Size variants', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('renders small size button correctly', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" size="sm" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('h-8', 'w-8');

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('renders medium size button correctly (default)', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('h-10', 'w-10');

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-5', 'w-5');
    });

    it('renders large size button correctly', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" size="lg" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('h-12', 'w-12');

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-6', 'w-6');
    });
  });

  describe('Button variant', () => {
    beforeEach(() => {
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
    });

    it('renders button variant with text when not wishlisted', () => {
      mockIsInWishlist.mockReturnValue(false);

      render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders button variant with text when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('shows "Save to wishlist" aria-label in button variant when not wishlisted', () => {
      mockIsInWishlist.mockReturnValue(false);

      render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      const button = screen.getByLabelText('Save to wishlist');
      expect(button).toBeInTheDocument();
    });

    it('shows "Remove from wishlist" aria-label in button variant when wishlisted', () => {
      mockIsInWishlist.mockReturnValue(true);

      render(<WishlistButton campsiteId="campsite-123" variant="button" />);

      const button = screen.getByLabelText('Remove from wishlist');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('disables button when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        role: 'user',
        loading: true,
        error: null,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        refreshSession: jest.fn(),
      });

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      expect(button).toBeDisabled();
    });

    it('applies opacity and cursor styles when loading', async () => {
      mockToggleItem.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const { container } = render(<WishlistButton campsiteId="campsite-123" />);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(button).toHaveClass('opacity-70', 'cursor-not-allowed');
      });
    });
  });

  describe('Custom className', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('applies custom className to icon variant', () => {
      const { container } = render(<WishlistButton campsiteId="campsite-123" className="custom-class" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies custom className to button variant', () => {
      render(<WishlistButton campsiteId="campsite-123" variant="button" className="custom-class" />);

      const button = screen.getByLabelText('Save to wishlist');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
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
      mockIsInWishlist.mockReturnValue(false);
    });

    it('logs error to console when toggle fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);

      render(<WishlistButton campsiteId="campsite-123" />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle wishlist:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not call onToggle when toggle fails', async () => {
      const onToggle = jest.fn();
      const error = new Error('Network error');
      mockToggleItem.mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      render(<WishlistButton campsiteId="campsite-123" onToggle={onToggle} />);

      const button = screen.getByLabelText('Add to wishlist');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalled();
      });

      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
