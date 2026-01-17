import { render, screen } from '@testing-library/react';
import { WishlistCounter } from '@/components/wishlist/WishlistCounter';
import { useWishlistCount } from '@/hooks/useWishlist';

// Mock the useWishlistCount hook
jest.mock('@/hooks/useWishlist', () => ({
  useWishlistCount: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className, ...props }: any) => {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  };
});

const mockUseWishlistCount = useWishlistCount as jest.MockedFunction<typeof useWishlistCount>;

describe('WishlistCounter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Displays Correct Count', () => {
    it('shows count badge when count is greater than 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 5,
        isLoading: false,
      });

      render(<WishlistCounter />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays count in badge element', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.bg-red-500');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('includes count in aria-label for accessibility', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 7,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByLabelText('Wishlist (7 items)');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Updates When Wishlist Changes', () => {
    it('updates count when hook returns different value', () => {
      const { rerender } = render(<WishlistCounter />);

      mockUseWishlistCount.mockReturnValue({
        count: 2,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      expect(screen.getByText('2')).toBeInTheDocument();

      mockUseWishlistCount.mockReturnValue({
        count: 5,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('shows badge when count changes from 0 to positive', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      const { rerender, container } = render(<WishlistCounter />);

      expect(container.querySelector('.bg-red-500')).not.toBeInTheDocument();

      mockUseWishlistCount.mockReturnValue({
        count: 1,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('hides badge when count changes from positive to 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: false,
      });

      const { rerender, container } = render(<WishlistCounter />);

      expect(screen.getByText('3')).toBeInTheDocument();

      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      expect(container.querySelector('.bg-red-500')).not.toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });
  });

  describe('Hides When Count is 0', () => {
    it('does not show badge when count is 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.bg-red-500');
      expect(badge).not.toBeInTheDocument();
    });

    it('does not show badge when count is 0 and loading is true', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: true,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.bg-red-500');
      expect(badge).not.toBeInTheDocument();
    });

    it('aria-label does not include count when count is 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByLabelText('Wishlist');
      expect(link).toBeInTheDocument();
      expect(link).not.toHaveAttribute('aria-label', 'Wishlist (0 items)');
    });

    it('still renders Heart icon when count is 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const heartIcon = container.querySelector('.text-gray-700');
      expect(heartIcon).toBeInTheDocument();
      expect(heartIcon?.tagName).toBe('svg');
    });
  });

  describe('Shows Badge with Count Number', () => {
    it('displays badge with red background', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 4,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.bg-red-500');
      expect(badge).toBeInTheDocument();
    });

    it('displays badge with white text', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 6,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.text-white');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('6');
    });

    it('positions badge in top-right corner', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 2,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.absolute.-top-0\\.5.-right-0\\.5');
      expect(badge).toBeInTheDocument();
    });

    it('displays badge with rounded shape', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 8,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
    });

    it('uses small font size for count text', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 1,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.text-xs');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1');
    });
  });

  describe('Handles Large Numbers', () => {
    it('displays 99+ when count exceeds 99', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 100,
        isLoading: false,
      });

      render(<WishlistCounter />);

      expect(screen.getByText('99+')).toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    it('displays 99+ when count is 150', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 150,
        isLoading: false,
      });

      render(<WishlistCounter />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('displays 99 when count is exactly 99', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 99,
        isLoading: false,
      });

      render(<WishlistCounter />);

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.queryByText('99+')).not.toBeInTheDocument();
    });

    it('displays 98 when count is 98', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 98,
        isLoading: false,
      });

      render(<WishlistCounter />);

      expect(screen.getByText('98')).toBeInTheDocument();
    });

    it('aria-label includes actual count even when displaying 99+', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 125,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByLabelText('Wishlist (125 items)');
      expect(link).toBeInTheDocument();
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('hides badge while loading even if count is positive', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 5,
        isLoading: true,
      });

      const { container } = render(<WishlistCounter />);

      const badge = container.querySelector('.bg-red-500');
      expect(badge).not.toBeInTheDocument();
    });

    it('shows badge after loading completes', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: true,
      });

      const { rerender, container } = render(<WishlistCounter />);

      expect(container.querySelector('.bg-red-500')).not.toBeInTheDocument();

      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Link Functionality', () => {
    it('links to wishlist page', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 5,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/wishlist');
    });

    it('renders as a link element', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 2,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Heart Icon', () => {
    it('always displays heart icon regardless of count', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      const { container, rerender } = render(<WishlistCounter />);

      let heartIcon = container.querySelector('.text-gray-700');
      expect(heartIcon).toBeInTheDocument();

      mockUseWishlistCount.mockReturnValue({
        count: 10,
        isLoading: false,
      });
      rerender(<WishlistCounter />);

      heartIcon = container.querySelector('.text-gray-700');
      expect(heartIcon).toBeInTheDocument();
    });

    it('heart icon has correct size classes', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const heartIcon = container.querySelector('.h-6.w-6');
      expect(heartIcon).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className when provided', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 2,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter className="custom-class" />);

      const link = container.querySelector('.custom-class');
      expect(link).toBeInTheDocument();
    });

    it('maintains default styles when custom className provided', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 4,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter className="custom-class" />);

      const link = container.querySelector('.rounded-full');
      expect(link).toBeInTheDocument();
    });

    it('applies hover styles', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 1,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const link = container.querySelector('.hover\\:bg-gray-100');
      expect(link).toBeInTheDocument();
    });

    it('applies focus styles for accessibility', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 3,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const link = container.querySelector('.focus\\:ring-2.focus\\:ring-green-500');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides descriptive aria-label with count', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 12,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByLabelText('Wishlist (12 items)');
      expect(link).toBeInTheDocument();
    });

    it('provides basic aria-label without count when count is 0', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 0,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByLabelText('Wishlist');
      expect(link).toBeInTheDocument();
    });

    it('uses semantic link element', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 5,
        isLoading: false,
      });

      render(<WishlistCounter />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('has focus outline styles', () => {
      mockUseWishlistCount.mockReturnValue({
        count: 2,
        isLoading: false,
      });

      const { container } = render(<WishlistCounter />);

      const link = container.querySelector('.focus\\:outline-none');
      expect(link).toBeInTheDocument();
    });
  });
});
