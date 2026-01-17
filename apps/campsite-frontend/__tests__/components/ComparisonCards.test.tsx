import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonCards } from '@/components/compare/ComparisonCards';
import type { CampsiteDetail } from '@campsite/shared';

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

describe('ComparisonCards', () => {
  const mockCampsite1: CampsiteDetail = {
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
    is_featured: true,
    check_in_time: '14:00',
    check_out_time: '12:00',
    amenities: [
      { id: 1, slug: 'wifi', name_th: 'WiFi', name_en: 'WiFi', icon: 'wifi' },
      { id: 2, slug: 'parking', name_th: 'ที่จอดรถ', name_en: 'Parking', icon: 'parking' },
      { id: 3, slug: 'electricity', name_th: 'ไฟฟ้า', name_en: 'Electricity', icon: 'electricity' },
    ],
    photos: [
      { id: 1, url: 'https://example.com/photo1.jpg', display_order: 1 },
    ],
    owner_id: 'owner-001',
    contact_phone: '0812345678',
    contact_email: 'contact@mountain.com',
    contact_line_id: 'mountain_camping',
    latitude: 18.7883,
    longitude: 98.9853,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    status: 'approved',
    accommodations: [],
    nearby_attractions: [],
  };

  const mockCampsite2: CampsiteDetail = {
    id: 'campsite-002',
    name: 'Beach Paradise Glamping Resort',
    description: 'Luxury glamping experience by the beach',
    slug: 'beach-paradise-glamping',
    campsite_type: 'glamping',
    province: {
      id: 2,
      name_th: 'ภูเก็ต',
      name_en: 'Phuket',
      slug: 'phuket',
    },
    min_price: 2000,
    max_price: 5000,
    average_rating: 4.8,
    review_count: 87,
    is_featured: false,
    check_in_time: '15:00',
    check_out_time: '11:00',
    amenities: [
      { id: 1, slug: 'wifi', name_th: 'WiFi', name_en: 'WiFi', icon: 'wifi' },
      { id: 4, slug: 'ac', name_th: 'เครื่องปรับอากาศ', name_en: 'Air Conditioning', icon: 'ac' },
      { id: 5, slug: 'hot-water', name_th: 'น้ำร้อน', name_en: 'Hot Water', icon: 'hot-water' },
      { id: 6, slug: 'restaurant', name_th: 'ร้านอาหาร', name_en: 'Restaurant', icon: 'restaurant' },
    ],
    photos: [
      { id: 2, url: 'https://example.com/photo2.jpg', display_order: 1 },
    ],
    owner_id: 'owner-002',
    contact_phone: '0823456789',
    contact_email: 'contact@beach.com',
    contact_line_id: 'beach_glamping',
    latitude: 7.8804,
    longitude: 98.3923,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    is_active: true,
    status: 'approved',
    accommodations: [],
    nearby_attractions: [],
  };

  const mockCampsite3: CampsiteDetail = {
    id: 'campsite-003',
    name: 'Riverside Cabin Experience with Amazing Views',
    description: 'Cozy cabin by the river',
    slug: 'riverside-cabin',
    campsite_type: 'cabin',
    province: {
      id: 3,
      name_th: 'กาญจนบุรี',
      name_en: 'Kanchanaburi',
      slug: 'kanchanaburi',
    },
    min_price: 1200,
    max_price: 1200,
    average_rating: 4.2,
    review_count: 45,
    is_featured: false,
    check_in_time: '14:00',
    check_out_time: '12:00',
    amenities: [
      { id: 7, slug: 'private-bathroom', name_th: 'ห้องน้ำส่วนตัว', name_en: 'Private Bathroom', icon: 'bathroom' },
      { id: 8, slug: 'kitchen', name_th: 'ครัว', name_en: 'Kitchen', icon: 'kitchen' },
    ],
    photos: [
      { id: 3, url: 'https://example.com/photo3.jpg', display_order: 1 },
    ],
    owner_id: 'owner-003',
    contact_phone: '0834567890',
    contact_email: 'contact@riverside.com',
    contact_line_id: 'riverside_cabin',
    latitude: 14.0208,
    longitude: 99.5326,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    is_active: true,
    status: 'approved',
    accommodations: [],
    nearby_attractions: [],
  };

  describe('Tab-Based Layout', () => {
    it('renders tab buttons for all campsites', () => {
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      // Name gets truncated to 20 chars + "..."
      expect(screen.getByText('Beach Paradise Glamp...')).toBeInTheDocument();
      expect(screen.getByText('Riverside Cabin Expe...')).toBeInTheDocument();
    });

    it('truncates long campsite names in tabs with ellipsis', () => {
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const longNameButton = screen.getByText('Riverside Cabin Expe...');
      expect(longNameButton).toBeInTheDocument();
    });

    it('shows first campsite as active by default', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const tabButtons = container.querySelectorAll('button.rounded-full');
      expect(tabButtons[0]).toHaveClass('bg-green-600', 'text-white');
      expect(tabButtons[1]).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('displays first campsite data by default', () => {
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      expect(screen.getByRole('heading', { name: 'Mountain View Camping' })).toBeInTheDocument();
      // Description is not displayed in the component, only in the details section
    });
  });

  describe('Tab Switching', () => {
    it('switches to second campsite when clicking second tab', async () => {
      const user = userEvent.setup();
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const secondTab = screen.getByText('Beach Paradise Glamp...');
      await user.click(secondTab);

      expect(screen.getByRole('heading', { name: 'Beach Paradise Glamping Resort' })).toBeInTheDocument();
    });

    it('updates active tab styling when switching', async () => {
      const user = userEvent.setup();
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const tabButtons = container.querySelectorAll('button.rounded-full');

      await user.click(tabButtons[1]);

      expect(tabButtons[1]).toHaveClass('bg-green-600', 'text-white');
      expect(tabButtons[0]).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('switches to third campsite when clicking third tab', async () => {
      const user = userEvent.setup();
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const thirdTab = screen.getByText('Riverside Cabin Expe...');
      await user.click(thirdTab);

      expect(screen.getByRole('heading', { name: /Riverside Cabin Experience/ })).toBeInTheDocument();
    });

    it('switches between multiple tabs correctly', async () => {
      const user = userEvent.setup();
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const tabButtons = container.querySelectorAll('button.rounded-full');

      await user.click(tabButtons[1]);
      expect(screen.getByRole('heading', { name: 'Beach Paradise Glamping Resort' })).toBeInTheDocument();

      await user.click(tabButtons[0]);
      expect(screen.getByRole('heading', { name: 'Mountain View Camping' })).toBeInTheDocument();

      await user.click(tabButtons[2]);
      expect(screen.getByRole('heading', { name: /Riverside Cabin Experience/ })).toBeInTheDocument();
    });
  });

  describe('Campsite Data Display', () => {
    it('shows campsite image', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('shows placeholder when no image available', () => {
      const campsiteNoImage: CampsiteDetail = {
        ...mockCampsite1,
        photos: [],
      };

      render(<ComparisonCards campsites={[campsiteNoImage]} />);

      expect(screen.getByText('No image')).toBeInTheDocument();
    });

    it('displays campsite type', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Camping')).toBeInTheDocument();
    });

    it('displays province name', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Province')).toBeInTheDocument();
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
    });

    it('displays price range', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('500 - 1,500 THB')).toBeInTheDocument();
    });

    it('displays single price when min equals max', () => {
      render(<ComparisonCards campsites={[mockCampsite3]} />);

      expect(screen.getByText('1,200 THB')).toBeInTheDocument();
    });

    it('displays rating and review count', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('4.5 (123 reviews)')).toBeInTheDocument();
    });

    it('displays check-in time', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    it('displays check-out time', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Check-out')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    it('shows default check-in time when not provided', () => {
      const campsiteNoCheckIn: CampsiteDetail = {
        ...mockCampsite1,
        check_in_time: undefined,
      };

      render(<ComparisonCards campsites={[campsiteNoCheckIn]} />);

      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    it('shows default check-out time when not provided', () => {
      const campsiteNoCheckOut: CampsiteDetail = {
        ...mockCampsite1,
        check_out_time: undefined,
      };

      render(<ComparisonCards campsites={[campsiteNoCheckOut]} />);

      expect(screen.getByText('12:00')).toBeInTheDocument();
    });
  });

  describe('View Details Button', () => {
    it('renders View Details button', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const button = screen.getByRole('link', { name: 'View Details' });
      expect(button).toBeInTheDocument();
    });

    it('links to correct campsite detail page using id', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const button = screen.getByRole('link', { name: 'View Details' });
      expect(button).toHaveAttribute('href', '/campsites/campsite-001');
    });

    it('updates link when switching tabs', async () => {
      const user = userEvent.setup();
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const secondTab = screen.getByText('Beach Paradise Glamp...');
      await user.click(secondTab);

      const button = screen.getByRole('link', { name: 'View Details' });
      expect(button).toHaveAttribute('href', '/campsites/campsite-002');
    });

    it('renders button with proper structure', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const button = screen.getByRole('link', { name: 'View Details' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/campsites/campsite-001');
    });
  });

  describe('Amenities Display', () => {
    it('shows Amenities section heading', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('Amenities')).toBeInTheDocument();
    });

    it('displays all comparison amenities', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Air Conditioning')).toBeInTheDocument();
      expect(screen.getByText('Hot Water')).toBeInTheDocument();
      expect(screen.getByText('Private Bathroom')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Parking')).toBeInTheDocument();
    });

    it('shows check icon for available amenities', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const wifiSection = screen.getByText('WiFi').parentElement;
      expect(wifiSection).toHaveClass('bg-green-50', 'text-green-700');

      const checkIcon = wifiSection?.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });

    it('shows X icon for unavailable amenities', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const acSection = screen.getByText('Air Conditioning').parentElement;
      expect(acSection).toHaveClass('bg-gray-50', 'text-gray-400');

      const xIcon = acSection?.querySelector('svg');
      expect(xIcon).toBeInTheDocument();
    });

    it('correctly identifies available amenities', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const wifiSection = screen.getByText('WiFi').parentElement;
      expect(wifiSection).toHaveClass('bg-green-50', 'text-green-700');

      const parkingSection = screen.getByText('Parking').parentElement;
      expect(parkingSection).toHaveClass('bg-green-50', 'text-green-700');

      const electricitySection = screen.getByText('Electricity').parentElement;
      expect(electricitySection).toHaveClass('bg-green-50', 'text-green-700');
    });

    it('correctly identifies unavailable amenities', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const acSection = screen.getByText('Air Conditioning').parentElement;
      expect(acSection).toHaveClass('bg-gray-50', 'text-gray-400');

      const restaurantSection = screen.getByText('Restaurant').parentElement;
      expect(restaurantSection).toHaveClass('bg-gray-50', 'text-gray-400');
    });

    it('updates amenities when switching tabs', async () => {
      const user = userEvent.setup();
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      // First campsite: WiFi available, AC not available
      let wifiSection = screen.getByText('WiFi').parentElement;
      expect(wifiSection).toHaveClass('bg-green-50', 'text-green-700');

      let acSection = screen.getByText('Air Conditioning').parentElement;
      expect(acSection).toHaveClass('bg-gray-50', 'text-gray-400');

      // Switch to second campsite
      const secondTab = screen.getByText('Beach Paradise Glamp...');
      await user.click(secondTab);

      // Second campsite: both WiFi and AC available
      wifiSection = screen.getByText('WiFi').parentElement;
      expect(wifiSection).toHaveClass('bg-green-50', 'text-green-700');

      acSection = screen.getByText('Air Conditioning').parentElement;
      expect(acSection).toHaveClass('bg-green-50', 'text-green-700');
    });

    it('displays amenities in grid layout', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const amenitiesGrid = container.querySelector('.grid.grid-cols-2');
      expect(amenitiesGrid).toBeInTheDocument();
    });
  });

  describe('Navigation Dots', () => {
    it('renders navigation dots for all campsites', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const dots = container.querySelectorAll('.h-2.w-2.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('highlights active dot', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const dots = container.querySelectorAll('.h-2.w-2.rounded-full');
      expect(dots[0]).toHaveClass('bg-green-600');
      expect(dots[1]).toHaveClass('bg-gray-300');
    });

    it('switches campsite when clicking navigation dot', async () => {
      const user = userEvent.setup();
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      const dots = container.querySelectorAll('.h-2.w-2.rounded-full');
      await user.click(dots[1] as HTMLElement);

      expect(screen.getByRole('heading', { name: 'Beach Paradise Glamping Resort' })).toBeInTheDocument();
    });

    it('has accessible labels for navigation dots', () => {
      render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByLabelText('View campsite 1')).toBeInTheDocument();
      expect(screen.getByLabelText('View campsite 2')).toBeInTheDocument();
      expect(screen.getByLabelText('View campsite 3')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('returns null when no campsites provided', () => {
      const { container } = render(<ComparisonCards campsites={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders single campsite correctly', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      expect(screen.getByRole('heading', { name: 'Mountain View Camping' })).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('has scrollable tab container', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const tabContainer = container.querySelector('.overflow-x-auto');
      expect(tabContainer).toBeInTheDocument();
    });

    it('has responsive image sizing', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, 50vw');
    });

    it('uses aspect-video for image container', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const imageContainer = container.querySelector('.aspect-video');
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has focus ring on tab buttons', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1, mockCampsite2]} />);

      // Find tab buttons (not navigation dots)
      const tabButtons = Array.from(container.querySelectorAll('button')).filter(
        button => button.className.includes('rounded-full') && button.className.includes('px-4')
      );
      const tabButton = tabButtons[0];
      expect(tabButton).toHaveClass('focus:ring-2', 'focus:ring-green-500');
    });

    it('uses semantic heading for campsite name', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const heading = screen.getByRole('heading', { name: 'Mountain View Camping' });
      expect(heading.tagName).toBe('H2');
    });

    it('uses definition list for details', () => {
      const { container } = render(<ComparisonCards campsites={[mockCampsite1]} />);

      const definitionList = container.querySelector('dl');
      expect(definitionList).toBeInTheDocument();
    });

    it('has proper alt text for images', () => {
      render(<ComparisonCards campsites={[mockCampsite1]} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toBeInTheDocument();
    });
  });
});
