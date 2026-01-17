import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/components/campsite/HeroSection';
import type { CampsiteDetail } from '@campsite/shared';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({
    src,
    alt,
    fill,
    className,
    sizes,
    priority,
    onError,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    priority?: boolean;
    onError?: () => void;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        data-fill={fill}
        data-sizes={sizes}
        data-priority={priority}
        onError={onError}
      />
    );
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="map-pin-icon" />
  ),
  Star: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="star-icon" />
  ),
  Heart: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="heart-icon" />
  ),
  Share2: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="share2-icon" />
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
    'aria-label'?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

describe('HeroSection', () => {
  const mockCampsite: CampsiteDetail = {
    id: 'campsite-001',
    name: 'Mountain View Camping',
    slug: 'mountain-view-camping',
    description: 'Beautiful camping site with stunning mountain views',
    campsite_type: 'camping',
    province: {
      id: 1,
      name_th: 'เชียงใหม่',
      name_en: 'Chiang Mai',
      slug: 'chiang-mai',
    },
    address: '123 Mountain Road',
    latitude: 18.7883,
    longitude: 98.9853,
    contact_name: 'John Doe',
    contact_phone: '081-234-5678',
    contact_email: 'contact@mountainview.com',
    check_in_time: '14:00',
    check_out_time: '11:00',
    min_price: 500,
    max_price: 1500,
    average_rating: 4.5,
    review_count: 123,
    is_featured: true,
    status: 'approved',
    owner_id: 'owner-001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    photos: [
      {
        id: 'photo-001',
        campsite_id: 'campsite-001',
        url: 'https://example.com/photo1.jpg',
        alt_text: 'Main camping area',
        is_primary: true,
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'photo-002',
        campsite_id: 'campsite-001',
        url: 'https://example.com/photo2.jpg',
        alt_text: 'Tent setup',
        is_primary: false,
        display_order: 2,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'photo-003',
        campsite_id: 'campsite-001',
        url: 'https://example.com/photo3.jpg',
        alt_text: 'Mountain view',
        is_primary: false,
        display_order: 3,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    amenities: [],
    activities: [],
    accommodations: [],
  };

  const mockHandlers = {
    onOpenGallery: jest.fn(),
    onShare: jest.fn(),
    onWishlist: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Basic Information', () => {
    it('renders campsite name', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
    });

    it('renders campsite name as h1 heading', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Mountain View Camping');
    });

    it('renders location with province in Thai', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText('เชียงใหม่, Chiang Mai')).toBeInTheDocument();
    });

    it('renders location with province in English', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText(/Chiang Mai/)).toBeInTheDocument();
    });

    it('displays MapPin icon for location', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });
  });

  describe('Rating and Review Display', () => {
    it('renders average rating with one decimal place', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('renders review count', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText(/123 reviews/)).toBeInTheDocument();
    });

    it('displays star icon for rating', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('displays rating text description', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText(/ยอดเยี่ยม/)).toBeInTheDocument();
    });

    it('does not display rating when review count is zero', () => {
      const campsiteNoReviews: CampsiteDetail = {
        ...mockCampsite,
        average_rating: 0,
        review_count: 0,
      };

      render(<HeroSection campsite={campsiteNoReviews} />);

      expect(screen.queryByText('0.0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
    });

    it('formats rating with correct decimal for whole numbers', () => {
      const campsiteWholeRating: CampsiteDetail = {
        ...mockCampsite,
        average_rating: 5.0,
        review_count: 50,
      };

      render(<HeroSection campsite={campsiteWholeRating} />);

      expect(screen.getByText('5.0')).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('renders main image with primary photo', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const image = screen.getByAltText('Main camping area');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('uses campsite name as alt text when photo alt_text is missing', () => {
      const campsiteNoAltText: CampsiteDetail = {
        ...mockCampsite,
        photos: [
          {
            ...mockCampsite.photos[0],
            alt_text: null,
          },
        ],
      };

      render(<HeroSection campsite={campsiteNoAltText} />);

      expect(screen.getByAltText('Mountain View Camping')).toBeInTheDocument();
    });

    it('prioritizes primary photo over first photo', () => {
      const campsiteWithPrimary: CampsiteDetail = {
        ...mockCampsite,
        photos: [
          {
            id: 'photo-001',
            campsite_id: 'campsite-001',
            url: 'https://example.com/first.jpg',
            alt_text: 'First photo',
            is_primary: false,
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'photo-002',
            campsite_id: 'campsite-001',
            url: 'https://example.com/primary.jpg',
            alt_text: 'Primary photo',
            is_primary: true,
            display_order: 2,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<HeroSection campsite={campsiteWithPrimary} />);

      const images = screen.getAllByAltText('Primary photo');
      // First image should be the primary one with priority
      expect(images[0]).toHaveAttribute('src', 'https://example.com/primary.jpg');
      expect(images[0]).toHaveAttribute('data-priority', 'true');
    });

    it('uses first photo when no primary photo is set', () => {
      const campsiteNoPrimary: CampsiteDetail = {
        ...mockCampsite,
        photos: [
          {
            id: 'photo-001',
            campsite_id: 'campsite-001',
            url: 'https://example.com/first.jpg',
            alt_text: 'First photo',
            is_primary: false,
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<HeroSection campsite={campsiteNoPrimary} />);

      const image = screen.getByAltText('First photo');
      expect(image).toHaveAttribute('src', 'https://example.com/first.jpg');
    });

    it('sets priority attribute on main image', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const image = container.querySelector('[data-priority="true"]');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Missing Image Handling', () => {
    it('displays placeholder when no photos available', () => {
      const campsiteNoPhotos: CampsiteDetail = {
        ...mockCampsite,
        photos: [],
      };

      render(<HeroSection campsite={campsiteNoPhotos} />);

      expect(screen.getByText('No image available')).toBeInTheDocument();
    });

    it('displays placeholder when image fails to load', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const image = screen.getByAltText('Main camping area');
      fireEvent.error(image);

      expect(screen.getByText('No image available')).toBeInTheDocument();
    });

    it('applies correct styling to placeholder', () => {
      const campsiteNoPhotos: CampsiteDetail = {
        ...mockCampsite,
        photos: [],
      };

      const { container } = render(<HeroSection campsite={campsiteNoPhotos} />);

      const placeholder = container.querySelector('.bg-muted');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Additional Photos Grid', () => {
    it('renders additional photos on desktop', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByAltText('Tent setup')).toBeInTheDocument();
      expect(screen.getByAltText('Mountain view')).toBeInTheDocument();
    });

    it('displays view all photos button when multiple photos exist', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByText('View all 3 photos')).toBeInTheDocument();
    });

    it('does not display view all button when only one photo', () => {
      const campsiteOnePhoto: CampsiteDetail = {
        ...mockCampsite,
        photos: [mockCampsite.photos[0]],
      };

      render(<HeroSection campsite={campsiteOnePhoto} />);

      expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
    });

    it('calls onOpenGallery when view all button is clicked', () => {
      render(<HeroSection campsite={mockCampsite} {...mockHandlers} />);

      const viewAllButton = screen.getByText('View all 3 photos');
      fireEvent.click(viewAllButton);

      expect(mockHandlers.onOpenGallery).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenGallery when main image is clicked', () => {
      render(<HeroSection campsite={mockCampsite} {...mockHandlers} />);

      const image = screen.getByAltText('Main camping area');
      const imageContainer = image.parentElement;
      if (imageContainer) {
        fireEvent.click(imageContainer);
      }

      expect(mockHandlers.onOpenGallery).toHaveBeenCalled();
    });
  });

  describe('Action Buttons', () => {
    it('renders share button', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const shareButton = screen.getByLabelText('Share');
      expect(shareButton).toBeInTheDocument();
    });

    it('renders wishlist button', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const wishlistButton = screen.getByLabelText('Add to wishlist');
      expect(wishlistButton).toBeInTheDocument();
    });

    it('calls onShare when share button is clicked', () => {
      render(<HeroSection campsite={mockCampsite} {...mockHandlers} />);

      const shareButton = screen.getByLabelText('Share');
      fireEvent.click(shareButton);

      expect(mockHandlers.onShare).toHaveBeenCalledTimes(1);
    });

    it('calls onWishlist when wishlist button is clicked', () => {
      render(<HeroSection campsite={mockCampsite} {...mockHandlers} />);

      const wishlistButton = screen.getByLabelText('Add to wishlist');
      fireEvent.click(wishlistButton);

      expect(mockHandlers.onWishlist).toHaveBeenCalledTimes(1);
    });

    it('displays correct aria-label when item is wishlisted', () => {
      render(<HeroSection campsite={mockCampsite} isWishlisted={true} />);

      expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
    });

    it('applies red styling when item is wishlisted', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} isWishlisted={true} />);

      const wishlistButton = screen.getByLabelText('Remove from wishlist');
      expect(wishlistButton).toHaveClass('text-red-500', 'border-red-500');

      const heartIcon = container.querySelector('.fill-red-500');
      expect(heartIcon).toBeInTheDocument();
    });

    it('displays share icon', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByTestId('share2-icon')).toBeInTheDocument();
    });

    it('displays heart icon', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies correct grid layout classes', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4', 'md:grid-rows-2');
    });

    it('applies responsive height classes', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('h-[300px]', 'md:h-[400px]', 'lg:h-[500px]');
    });

    it('applies rounded corners to image grid', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('rounded-xl', 'overflow-hidden');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic h1 heading for campsite name', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.tagName).toBe('H1');
    });

    it('provides alt text for all images', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
      });
    });

    it('provides aria-labels for icon buttons', () => {
      render(<HeroSection campsite={mockCampsite} />);

      expect(screen.getByLabelText('Share')).toBeInTheDocument();
      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
    });

    it('uses semantic section element', () => {
      const { container } = render(<HeroSection campsite={mockCampsite} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Optional Handlers', () => {
    it('does not crash when onOpenGallery is not provided', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const viewAllButton = screen.getByText('View all 3 photos');
      expect(() => fireEvent.click(viewAllButton)).not.toThrow();
    });

    it('does not crash when onShare is not provided', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const shareButton = screen.getByLabelText('Share');
      expect(() => fireEvent.click(shareButton)).not.toThrow();
    });

    it('does not crash when onWishlist is not provided', () => {
      render(<HeroSection campsite={mockCampsite} />);

      const wishlistButton = screen.getByLabelText('Add to wishlist');
      expect(() => fireEvent.click(wishlistButton)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long campsite names', () => {
      const longNameCampsite: CampsiteDetail = {
        ...mockCampsite,
        name: 'Very Long Campsite Name That Should Still Be Displayed Properly Without Breaking Layout',
      };

      render(<HeroSection campsite={longNameCampsite} />);

      expect(
        screen.getByText(
          'Very Long Campsite Name That Should Still Be Displayed Properly Without Breaking Layout'
        )
      ).toBeInTheDocument();
    });

    it('handles campsite with many photos', () => {
      const manyPhotosCampsite: CampsiteDetail = {
        ...mockCampsite,
        photos: Array.from({ length: 20 }, (_, i) => ({
          id: `photo-${i}`,
          campsite_id: 'campsite-001',
          url: `https://example.com/photo${i}.jpg`,
          alt_text: `Photo ${i}`,
          is_primary: i === 0,
          display_order: i,
          created_at: '2024-01-01T00:00:00Z',
        })),
      };

      render(<HeroSection campsite={manyPhotosCampsite} />);

      expect(screen.getByText('View all 20 photos')).toBeInTheDocument();
    });

    it('handles decimal ratings correctly', () => {
      const decimalRatingCampsite: CampsiteDetail = {
        ...mockCampsite,
        average_rating: 4.75,
        review_count: 200,
      };

      render(<HeroSection campsite={decimalRatingCampsite} />);

      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
  });
});
