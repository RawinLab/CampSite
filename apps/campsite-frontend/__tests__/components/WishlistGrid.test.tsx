import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishlistGrid } from '@/components/wishlist/WishlistGrid';
import type { WishlistItemWithCampsite } from '@campsite/shared';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({
    src,
    alt,
    fill,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} data-fill={fill} data-sizes={sizes} />;
  };
});

// Mock WishlistCard component
jest.mock('@/components/wishlist/WishlistCard', () => ({
  WishlistCard: ({
    item,
    isSelected,
    selectionMode,
    onToggleSelection,
    onRemove,
  }: {
    item: WishlistItemWithCampsite;
    isSelected?: boolean;
    selectionMode?: boolean;
    onToggleSelection?: (id: string) => void;
    onRemove?: (campsiteId: string) => void;
  }) => (
    <div data-testid={`wishlist-card-${item.campsite.id}`}>
      <h3>{item.campsite.name}</h3>
      <p>{item.campsite.province.name_en}</p>
      <span data-testid="price">
        {item.campsite.min_price.toLocaleString()} THB
      </span>
      {isSelected && <span data-testid="selected">Selected</span>}
      {selectionMode && <span data-testid="selection-mode">Selection Mode</span>}
      {onToggleSelection && (
        <button
          onClick={() => onToggleSelection(item.campsite.id)}
          data-testid={`toggle-${item.campsite.id}`}
        >
          Toggle Selection
        </button>
      )}
      {onRemove && (
        <button
          onClick={() => onRemove(item.campsite.id)}
          data-testid={`remove-${item.campsite.id}`}
        >
          Remove
        </button>
      )}
    </div>
  ),
}));

describe('WishlistGrid', () => {
  const mockWishlistItems: WishlistItemWithCampsite[] = [
    {
      id: 'wishlist-001',
      user_id: 'user-001',
      campsite_id: 'campsite-001',
      created_at: '2024-01-01T00:00:00Z',
      notes: null,
      campsite: {
        id: 'campsite-001',
        name: 'Mountain View Camping',
        description: 'Beautiful camping site with stunning mountain views',
        slug: 'mountain-view-camping',
        campsite_type: 'camping',
        province: {
          id: 1,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
        },
        min_price: 500,
        max_price: 1500,
        average_rating: 4.5,
        review_count: 123,
        is_featured: false,
        thumbnail_url: 'https://example.com/thumbnail1.jpg',
        amenities: ['wifi', 'parking', 'restroom'],
      },
    },
    {
      id: 'wishlist-002',
      user_id: 'user-001',
      campsite_id: 'campsite-002',
      created_at: '2024-01-02T00:00:00Z',
      notes: 'Perfect for weekend getaway',
      campsite: {
        id: 'campsite-002',
        name: 'Beach Glamping Paradise',
        description: 'Luxury glamping by the beach',
        slug: 'beach-glamping-paradise',
        campsite_type: 'glamping',
        province: {
          id: 2,
          name_th: 'ภูเก็ต',
          name_en: 'Phuket',
          slug: 'phuket',
        },
        min_price: 2000,
        max_price: 3000,
        average_rating: 4.8,
        review_count: 89,
        is_featured: true,
        thumbnail_url: 'https://example.com/thumbnail2.jpg',
        amenities: ['wifi', 'pool', 'restaurant'],
      },
    },
    {
      id: 'wishlist-003',
      user_id: 'user-001',
      campsite_id: 'campsite-003',
      created_at: '2024-01-03T00:00:00Z',
      notes: null,
      campsite: {
        id: 'campsite-003',
        name: 'Forest Cabin Retreat',
        description: 'Cozy cabin in the woods',
        slug: 'forest-cabin-retreat',
        campsite_type: 'cabin',
        province: {
          id: 3,
          name_th: 'กาญจนบุรี',
          name_en: 'Kanchanaburi',
          slug: 'kanchanaburi',
        },
        min_price: 1200,
        max_price: 1800,
        average_rating: 4.6,
        review_count: 56,
        is_featured: false,
        thumbnail_url: null,
        amenities: ['parking', 'firepit', 'hiking'],
      },
    },
  ];

  describe('Rendering Grid of Wishlist Items', () => {
    it('renders all wishlist items in a grid', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      expect(screen.getByTestId('wishlist-card-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-card-campsite-002')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-card-campsite-003')).toBeInTheDocument();
    });

    it('renders correct number of wishlist items', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      const cards = screen.getAllByTestId(/^wishlist-card-/);
      expect(cards).toHaveLength(3);
    });

    it('renders items with correct data', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('Beach Glamping Paradise')).toBeInTheDocument();
      expect(screen.getByText('Forest Cabin Retreat')).toBeInTheDocument();

      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
      expect(screen.getByText('Phuket')).toBeInTheDocument();
      expect(screen.getByText('Kanchanaburi')).toBeInTheDocument();
    });

    it('displays price information for each item', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      const prices = screen.getAllByTestId('price');
      expect(prices).toHaveLength(3);
      expect(prices[0]).toHaveTextContent('500 THB');
      expect(prices[1]).toHaveTextContent('2,000 THB');
      expect(prices[2]).toHaveTextContent('1,200 THB');
    });
  });

  describe('Empty Wishlist Handling', () => {
    it('renders empty grid when items array is empty', () => {
      const { container } = render(<WishlistGrid items={[]} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(0);
    });

    it('does not render any wishlist cards when items is empty', () => {
      render(<WishlistGrid items={[]} />);

      const cards = screen.queryAllByTestId(/^wishlist-card-/);
      expect(cards).toHaveLength(0);
    });

    it('maintains grid structure even when empty', () => {
      const { container } = render(<WishlistGrid items={[]} />);

      const grid = container.querySelector('.grid.gap-6');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Grid Layout Responsiveness', () => {
    it('applies responsive grid classes', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('gap-6');
    });

    it('applies sm:grid-cols-2 for small screens', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const grid = container.querySelector('.sm\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('applies lg:grid-cols-3 for large screens', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const grid = container.querySelector('.lg\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('applies xl:grid-cols-4 for extra large screens', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const grid = container.querySelector('.xl\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('applies correct gap spacing', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const grid = container.querySelector('.gap-6');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Remove Button Functionality', () => {
    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnRemove = jest.fn();

      render(<WishlistGrid items={mockWishlistItems} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTestId('remove-campsite-001');
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith('campsite-001');
    });

    it('calls onRemove with correct campsite_id for different items', async () => {
      const user = userEvent.setup();
      const mockOnRemove = jest.fn();

      render(<WishlistGrid items={mockWishlistItems} onRemove={mockOnRemove} />);

      const removeButton2 = screen.getByTestId('remove-campsite-002');
      await user.click(removeButton2);

      expect(mockOnRemove).toHaveBeenCalledWith('campsite-002');

      const removeButton3 = screen.getByTestId('remove-campsite-003');
      await user.click(removeButton3);

      expect(mockOnRemove).toHaveBeenCalledWith('campsite-003');
    });

    it('handles multiple remove button clicks', async () => {
      const user = userEvent.setup();
      const mockOnRemove = jest.fn();

      render(<WishlistGrid items={mockWishlistItems} onRemove={mockOnRemove} />);

      const removeButton1 = screen.getByTestId('remove-campsite-001');
      const removeButton2 = screen.getByTestId('remove-campsite-002');

      await user.click(removeButton1);
      await user.click(removeButton2);

      expect(mockOnRemove).toHaveBeenCalledTimes(2);
      expect(mockOnRemove).toHaveBeenNthCalledWith(1, 'campsite-001');
      expect(mockOnRemove).toHaveBeenNthCalledWith(2, 'campsite-002');
    });

    it('renders remove buttons for all items when onRemove is provided', () => {
      const mockOnRemove = jest.fn();

      render(<WishlistGrid items={mockWishlistItems} onRemove={mockOnRemove} />);

      expect(screen.getByTestId('remove-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('remove-campsite-002')).toBeInTheDocument();
      expect(screen.getByTestId('remove-campsite-003')).toBeInTheDocument();
    });
  });

  describe('Selection Mode', () => {
    it('passes selectionMode prop to each card', () => {
      render(<WishlistGrid items={mockWishlistItems} selectionMode={true} />);

      const selectionModeIndicators = screen.getAllByTestId('selection-mode');
      expect(selectionModeIndicators).toHaveLength(3);
    });

    it('passes selectedIds to each card correctly', () => {
      const selectedIds = new Set(['campsite-001', 'campsite-003']);

      render(<WishlistGrid items={mockWishlistItems} selectedIds={selectedIds} />);

      expect(screen.getByTestId('wishlist-card-campsite-001')).toHaveTextContent('Selected');
      expect(screen.getByTestId('wishlist-card-campsite-003')).toHaveTextContent('Selected');
      expect(screen.queryByTestId('wishlist-card-campsite-002')).not.toHaveTextContent('Selected');
    });

    it('calls onToggleSelection when item is clicked in selection mode', async () => {
      const user = userEvent.setup();
      const mockOnToggleSelection = jest.fn();

      render(
        <WishlistGrid
          items={mockWishlistItems}
          selectionMode={true}
          onToggleSelection={mockOnToggleSelection}
        />
      );

      const toggleButton = screen.getByTestId('toggle-campsite-001');
      await user.click(toggleButton);

      expect(mockOnToggleSelection).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSelection).toHaveBeenCalledWith('campsite-001');
    });

    it('toggles multiple items independently', async () => {
      const user = userEvent.setup();
      const mockOnToggleSelection = jest.fn();

      render(
        <WishlistGrid
          items={mockWishlistItems}
          selectionMode={true}
          onToggleSelection={mockOnToggleSelection}
        />
      );

      await user.click(screen.getByTestId('toggle-campsite-001'));
      await user.click(screen.getByTestId('toggle-campsite-002'));
      await user.click(screen.getByTestId('toggle-campsite-003'));

      expect(mockOnToggleSelection).toHaveBeenCalledTimes(3);
      expect(mockOnToggleSelection).toHaveBeenNthCalledWith(1, 'campsite-001');
      expect(mockOnToggleSelection).toHaveBeenNthCalledWith(2, 'campsite-002');
      expect(mockOnToggleSelection).toHaveBeenNthCalledWith(3, 'campsite-003');
    });

    it('uses empty Set as default for selectedIds', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      const selectedIndicators = screen.queryAllByTestId('selected');
      expect(selectedIndicators).toHaveLength(0);
    });

    it('defaults selectionMode to false', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      const selectionModeIndicators = screen.queryAllByTestId('selection-mode');
      expect(selectionModeIndicators).toHaveLength(0);
    });
  });

  describe('Key Prop for List Items', () => {
    it('uses unique key for each wishlist item', () => {
      const { container } = render(<WishlistGrid items={mockWishlistItems} />);

      const cards = container.querySelectorAll('[data-testid^="wishlist-card-"]');
      const keys = Array.from(cards).map((card) => card.getAttribute('data-testid'));

      expect(new Set(keys).size).toBe(keys.length);
    });

    it('uses wishlist item id as key', () => {
      render(<WishlistGrid items={mockWishlistItems} />);

      expect(screen.getByTestId('wishlist-card-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-card-campsite-002')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-card-campsite-003')).toBeInTheDocument();
    });
  });

  describe('Single Item Grid', () => {
    it('renders single item correctly', () => {
      const singleItem = [mockWishlistItems[0]];

      render(<WishlistGrid items={singleItem} />);

      expect(screen.getByTestId('wishlist-card-campsite-001')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^wishlist-card-/)).toHaveLength(1);
    });

    it('maintains grid layout with single item', () => {
      const singleItem = [mockWishlistItems[0]];

      const { container } = render(<WishlistGrid items={singleItem} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });

  describe('Large Number of Items', () => {
    it('renders many items efficiently', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        ...mockWishlistItems[0],
        id: `wishlist-${i}`,
        campsite_id: `campsite-${i}`,
        campsite: {
          ...mockWishlistItems[0].campsite,
          id: `campsite-${i}`,
          name: `Campsite ${i}`,
        },
      }));

      render(<WishlistGrid items={manyItems} />);

      const cards = screen.getAllByTestId(/^wishlist-card-/);
      expect(cards).toHaveLength(20);
    });
  });

  describe('Props Passing to WishlistCard', () => {
    it('passes all props correctly to WishlistCard', () => {
      const mockOnRemove = jest.fn();
      const mockOnToggleSelection = jest.fn();
      const selectedIds = new Set(['campsite-001']);

      render(
        <WishlistGrid
          items={mockWishlistItems}
          selectedIds={selectedIds}
          selectionMode={true}
          onToggleSelection={mockOnToggleSelection}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getAllByTestId('selection-mode')).toHaveLength(3);
      expect(screen.getByTestId('wishlist-card-campsite-001')).toHaveTextContent('Selected');
      expect(screen.getByTestId('toggle-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('remove-campsite-001')).toBeInTheDocument();
    });
  });
});
