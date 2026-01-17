import { render, screen, fireEvent } from '@testing-library/react';
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

describe('WishlistPage - Max 3 Selection Tests', () => {
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
    {
      id: 'wishlist-004',
      user_id: 'user-001',
      campsite_id: 'campsite-004',
      created_at: '2024-01-04T00:00:00Z',
      campsite: {
        id: 'campsite-004',
        name: 'Riverside Camp',
        slug: 'riverside-camp',
        campsite_type: 'tented-resort',
        province: { id: 4, name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi', slug: 'kanchanaburi' },
        min_price: 1200,
        max_price: 3000,
        average_rating: 4.7,
        review_count: 45,
        is_featured: false,
        thumbnail_url: 'https://example.com/thumbnail4.jpg',
      },
    },
    {
      id: 'wishlist-005',
      user_id: 'user-001',
      campsite_id: 'campsite-005',
      created_at: '2024-01-05T00:00:00Z',
      campsite: {
        id: 'campsite-005',
        name: 'Hilltop Bungalow',
        slug: 'hilltop-bungalow',
        campsite_type: 'bungalow',
        province: { id: 5, name_th: 'เพชรบูรณ์', name_en: 'Phetchabun', slug: 'phetchabun' },
        min_price: 600,
        max_price: 1800,
        average_rating: 4.4,
        review_count: 78,
        is_featured: false,
        thumbnail_url: 'https://example.com/thumbnail5.jpg',
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

  describe('Maximum Selection Limit', () => {
    it('should allow selecting up to 3 campsites', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      expect(screen.getByTestId('wishlist-item-campsite-001')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-002')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-003')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
    });

    it('should prevent selecting a 4th campsite', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Try to select a 4th item
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-004'));

      // 4th item should not be selected
      expect(screen.getByTestId('wishlist-item-campsite-004')).toHaveAttribute(
        'data-selected',
        'false'
      );
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
    });

    it('should maintain selection count at 3 when attempting to select more', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '3');

      // Try to select 4th and 5th items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-004'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-005'));

      // Count should still be 3
      expect(compareBar).toHaveAttribute('data-count', '3');
    });
  });

  describe('Selection After Reaching Maximum', () => {
    it('should allow deselecting items after reaching maximum', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Deselect one item
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      expect(screen.getByTestId('wishlist-item-campsite-001')).toHaveAttribute(
        'data-selected',
        'false'
      );
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '2');
    });

    it('should allow selecting a different item after deselecting one', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Deselect one item
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      // Select a different item
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-004'));

      expect(screen.getByTestId('wishlist-item-campsite-004')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
    });

    it('should allow reselecting a previously deselected item', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Deselect and reselect the same item
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      expect(screen.getByTestId('wishlist-item-campsite-001')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
    });
  });

  describe('Compare Bar Visibility with Selection Count', () => {
    it('should show compare bar when 1 item is selected', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '1');
    });

    it('should show compare bar when 2 items are selected', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '2');
    });

    it('should show compare bar when 3 items are selected', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '3');
    });

    it('should update compare bar count when deselecting from 3 to 2', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      const compareBar = screen.getByTestId('compare-bar');
      expect(compareBar).toHaveAttribute('data-count', '3');

      // Deselect one
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      expect(compareBar).toHaveAttribute('data-count', '2');
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle rapid clicks on the same item correctly', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      const item = screen.getByTestId('wishlist-item-campsite-001');

      // Rapid clicks
      fireEvent.click(item);
      fireEvent.click(item);
      fireEvent.click(item);

      // Should end up selected (odd number of clicks: select, deselect, select)
      expect(item).toHaveAttribute('data-selected', 'true');
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '1');
    });

    it('should handle selecting exactly 3 items and clearing', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');

      // Clear all
      fireEvent.click(screen.getByTestId('clear-button'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '0');
    });

    it('should allow selecting 3 items, clearing, and selecting 3 again', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');

      // Clear (also disables selection mode)
      fireEvent.click(screen.getByTestId('clear-button'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '0');

      // Re-enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 different items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-004'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-005'));

      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
      expect(screen.getByTestId('wishlist-item-campsite-003')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-004')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-005')).toHaveAttribute(
        'data-selected',
        'true'
      );
    });
  });

  describe('Edge Cases with Maximum Selection', () => {
    it('should correctly track selection state with Set data structure', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select same item multiple times (toggle behavior)
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));

      // Should be selected after odd number of toggles (select, deselect, select)
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '1');
    });

    it('should maintain max limit when switching between different items', () => {
      render(<WishlistPage />);

      // Enable selection mode
      fireEvent.click(screen.getAllByRole('button', { name: /Compare/i })[0]);

      // Select 3 items
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-002'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-003'));

      // Deselect first and select fourth
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-001'));
      fireEvent.click(screen.getByTestId('wishlist-item-campsite-004'));

      // Should have items 2, 3, and 4 selected
      expect(screen.getByTestId('compare-bar')).toHaveAttribute('data-count', '3');
      expect(screen.getByTestId('wishlist-item-campsite-001')).toHaveAttribute(
        'data-selected',
        'false'
      );
      expect(screen.getByTestId('wishlist-item-campsite-002')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-003')).toHaveAttribute(
        'data-selected',
        'true'
      );
      expect(screen.getByTestId('wishlist-item-campsite-004')).toHaveAttribute(
        'data-selected',
        'true'
      );
    });
  });
});
