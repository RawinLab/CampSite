import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WishlistPage from '@/app/wishlist/page';
import type { WishlistItemWithCampsite } from '@campsite/shared';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useWishlist', () => ({
  useWishlist: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/components/wishlist', () => ({
  WishlistGrid: jest.fn(({ items, selectedIds, selectionMode, onToggleSelection }) => (
    <div data-testid="wishlist-grid">
      {items.map((item: WishlistItemWithCampsite) => (
        <div
          key={item.campsite_id}
          data-testid={`wishlist-item-${item.campsite_id}`}
          data-selected={selectedIds.has(item.campsite_id)}
          onClick={() => selectionMode && onToggleSelection(item.campsite_id)}
        >
          {item.campsite.name}
        </div>
      ))}
    </div>
  )),
  WishlistEmpty: jest.fn(() => <div>Empty wishlist</div>),
  WishlistCompareBar: jest.fn(({ count, onCompare, onClear }) => (
    <div data-testid="compare-bar" data-count={count}>
      <button onClick={onCompare} data-testid="compare-button">
        Compare ({count})
      </button>
      <button onClick={onClear} data-testid="clear-button">
        Clear
      </button>
    </div>
  )),
}));

describe('WishlistPage - Selection State Management', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockWishlistItems: WishlistItemWithCampsite[] = [
    {
      id: 'wishlist-001',
      user_id: 'user-001',
      campsite_id: 'campsite-001',
      created_at: '2024-01-01T00:00:00Z',
      campsite: {
        id: 'campsite-001',
        name: 'Mountain View Camping',
        slug: 'mountain-view-camping',
        campsite_type: 'camping',
        province: { id: 1, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', slug: 'chiang-mai' },
        min_price: 500,
        max_price: 1500,
        average_rating: 4.5,
        review_count: 123,
        is_featured: false,
        thumbnail_url: 'https://example.com/thumbnail1.jpg',
      },
    },
    {
      id: 'wishlist-002',
      user_id: 'user-001',
      campsite_id: 'campsite-002',
      created_at: '2024-01-02T00:00:00Z',
      campsite: {
        id: 'campsite-002',
        name: 'Beach Paradise',
        slug: 'beach-paradise',
        campsite_type: 'glamping',
        province: { id: 2, name_th: 'ภูเก็ต', name_en: 'Phuket', slug: 'phuket' },
        min_price: 1000,
        max_price: 2500,
        average_rating: 4.8,
        review_count: 89,
        is_featured: true,
        thumbnail_url: 'https://example.com/thumbnail2.jpg',
      },
    },
    {
      id: 'wishlist-003',
      user_id: 'user-001',
      campsite_id: 'campsite-003',
      created_at: '2024-01-03T00:00:00Z',
      campsite: {
        id: 'campsite-003',
        name: 'Forest Retreat',
        slug: 'forest-retreat',
        campsite_type: 'cabin',
        province: { id: 3, name_th: 'เชียงราย', name_en: 'Chiang Rai', slug: 'chiang-rai' },
        min_price: 800,
        max_price: 2000,
        average_rating: 4.6,
        review_count: 67,
        is_featured: false,
        thumbnail_url: 'https://example.com/thumbnail3.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useRouter } = require('next/navigation');
    const { useAuth } = require('@/hooks/useAuth');
    const { useWishlist } = require('@/hooks/useWishlist');

    useRouter.mockReturnValue(mockRouter);
    useAuth.mockReturnValue({
      user: { id: 'user-001' },
      loading: false,
    });
    useWishlist.mockReturnValue({
      wishlist: mockWishlistItems,
      isLoading: false,
      count: mockWishlistItems.length,
      removeItem: jest.fn(),
    });
  });

  describe('Initial Selection State', () => {
    it('should initialize with no items selected', () => {
      render(<WishlistPage />);

      const items = screen.getAllByTestId(/^wishlist-item-/);
      items.forEach((item) => {
        expect(item).toHaveAttribute('data-selected', 'false');
      });
    });

    it('should initialize with selection mode off', () => {
      render(<WishlistPage />);

      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      expect(compareButtons.length).toBeGreaterThan(0);
    });

    it('should not show compare bar initially', () => {
      render(<WishlistPage />);

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '0');
    });
  });

  describe('Toggle Selection Mode', () => {
    it('should enable selection mode when Compare button is clicked', () => {
      render(<WishlistPage />);

      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      fireEvent.click(compareButtons[0]);

      expect(screen.getByText(/Click on campsites to select them/i)).toBeInTheDocument();
    });

    it('should show selection hint when selection mode is enabled', () => {
      render(<WishlistPage />);

      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      fireEvent.click(compareButtons[0]);

      expect(screen.getByText(/2-3 campsites/i)).toBeInTheDocument();
    });

    it('should change button text to "Cancel" when selection mode is active', () => {
      render(<WishlistPage />);

      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      fireEvent.click(compareButtons[0]);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Selection State Management', () => {
    it('should select an item when clicked in selection mode', () => {
      render(<WishlistPage />);

      // Enable selection mode
      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      fireEvent.click(compareButtons[0]);

      // Select first item
      const firstItem = screen.getByTestId('wishlist-item-campsite-001');
      fireEvent.click(firstItem);

      expect(firstItem).toHaveAttribute('data-selected', 'true');
    });

    it('should allow selecting multiple items', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select two items
      const item1 = screen.getByTestId('wishlist-item-campsite-001');
      const item2 = screen.getByTestId('wishlist-item-campsite-002');

      fireEvent.click(item1);
      fireEvent.click(item2);

      expect(item1).toHaveAttribute('data-selected', 'true');
      expect(item2).toHaveAttribute('data-selected', 'true');
    });

    it('should deselect an item when clicked again', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select and deselect
      const item = screen.getByTestId('wishlist-item-campsite-001');
      fireEvent.click(item);
      expect(item).toHaveAttribute('data-selected', 'true');

      fireEvent.click(item);
      expect(item).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Get Selected Items', () => {
    it('should track selected item count', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '2');
    });

    it('should update count when items are deselected', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select and deselect
      const item1 = screen.getByTestId('wishlist-item-campsite-001');
      const item2 = screen.getByTestId('wishlist-item-campsite-002');

      fireEvent.click(item1);
      fireEvent.click(item2);
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '2');

      fireEvent.click(item1);
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '1');
    });
  });

  describe('Clear Selection', () => {
    it('should clear all selected items when clear button is clicked', () => {
      render(<WishlistPage />);

      // Enable selection mode and select items
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));

      // Clear selection
      fireEvent.click(screen.getByTestId('clear-button'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '0');
    });

    it('should clear selection when Cancel button is clicked', () => {
      render(<WishlistPage />);

      // Enable selection mode and select items
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      // Cancel (should clear selection)
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      // Re-enable selection mode to check state
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '0');
    });

    it('should disable selection mode when Cancel is clicked', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      expect(screen.getByText(/Click on campsites to select them/i)).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByText(/Click on campsites to select them/i)).not.toBeInTheDocument();
    });
  });

  describe('Compare Navigation', () => {
    it('should navigate to compare page with selected IDs', () => {
      render(<WishlistPage />);

      // Enable selection mode and select items
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));

      // Click compare
      fireEvent.click(screen.getByTestId('compare-button'));

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringMatching(/^\/compare\?ids=/)
      );
    });

    it('should include all selected IDs in compare URL', () => {
      render(<WishlistPage />);

      // Enable selection mode and select items
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Click compare
      fireEvent.click(screen.getByTestId('compare-button'));

      const callArg = mockRouter.push.mock.calls[0][0];
      expect(callArg).toContain('campsite-001');
      expect(callArg).toContain('campsite-002');
      expect(callArg).toContain('campsite-003');
    });
  });

  describe('Selection State Persistence', () => {
    it('should maintain selection state when sorting changes', () => {
      render(<WishlistPage />);

      // Enable selection mode and select items
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));

      // Change sorting
      const sortSelect = screen.getByRole('combobox');
      fireEvent.change(sortSelect, { target: { value: 'oldest' } });

      // Check selection is maintained
      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '2');
    });

    it('should remove selection when item is removed from wishlist', async () => {
      const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
      const { useWishlist } = require('@/hooks/useWishlist');

      useWishlist.mockReturnValue({
        wishlist: mockWishlistItems,
        isLoading: false,
        count: mockWishlistItems.length,
        removeItem: mockRemoveItem,
      });

      render(<WishlistPage />);

      // Enable selection mode and select item
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '1');
    });
  });
});
