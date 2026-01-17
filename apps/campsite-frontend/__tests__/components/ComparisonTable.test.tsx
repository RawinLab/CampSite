import { render, screen } from '@testing-library/react';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
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

describe('ComparisonTable', () => {
  const mockCampsite1: CampsiteDetail = {
    id: 'campsite-001',
    name: 'Mountain View Camping',
    slug: 'mountain-view-camping',
    campsite_type: 'camping',
    description: 'Beautiful mountain views',
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
    check_in_time: '14:00',
    check_out_time: '12:00',
    photos: [
      {
        id: 'photo-1',
        url: 'https://example.com/photo1.jpg',
        display_order: 1,
        created_at: '2024-01-01',
      },
    ],
    amenities: [
      { id: 'amenity-1', slug: 'wifi', name_en: 'WiFi', name_th: 'ไวไฟ', icon: 'wifi', category: 'basic' },
      { id: 'amenity-2', slug: 'electricity', name_en: 'Electricity', name_th: 'ไฟฟ้า', icon: 'zap', category: 'basic' },
      { id: 'amenity-3', slug: 'parking', name_en: 'Parking', name_th: 'ที่จอดรถ', icon: 'parking', category: 'basic' },
    ],
    status: 'published',
    is_featured: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    contact_phone: '',
    contact_email: '',
    latitude: 0,
    longitude: 0,
    owner_id: '',
  };

  const mockCampsite2: CampsiteDetail = {
    id: 'campsite-002',
    name: 'Beach Paradise Glamping',
    slug: 'beach-paradise-glamping',
    campsite_type: 'glamping',
    description: 'Luxury beachside glamping',
    province: {
      id: 2,
      name_th: 'ภูเก็ต',
      name_en: 'Phuket',
      slug: 'phuket',
    },
    min_price: 2000,
    max_price: 2000,
    average_rating: 4.8,
    review_count: 87,
    check_in_time: '15:00',
    check_out_time: '11:00',
    photos: [
      {
        id: 'photo-2',
        url: 'https://example.com/photo2.jpg',
        display_order: 1,
        created_at: '2024-01-01',
      },
    ],
    amenities: [
      { id: 'amenity-4', slug: 'wifi', name_en: 'WiFi', name_th: 'ไวไฟ', icon: 'wifi', category: 'basic' },
      { id: 'amenity-5', slug: 'ac', name_en: 'Air Conditioning', name_th: 'เครื่องปรับอากาศ', icon: 'ac', category: 'basic' },
      { id: 'amenity-6', slug: 'hot-water', name_en: 'Hot Water', name_th: 'น้ำร้อน', icon: 'hot-water', category: 'basic' },
      { id: 'amenity-7', slug: 'restaurant', name_en: 'Restaurant', name_th: 'ร้านอาหาร', icon: 'restaurant', category: 'facility' },
    ],
    status: 'published',
    is_featured: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    contact_phone: '',
    contact_email: '',
    latitude: 0,
    longitude: 0,
    owner_id: '',
  };

  const mockCampsite3: CampsiteDetail = {
    id: 'campsite-003',
    name: 'Forest Cabin Retreat',
    slug: 'forest-cabin-retreat',
    campsite_type: 'cabin',
    description: 'Peaceful forest cabin',
    province: {
      id: 3,
      name_th: 'กาญจนบุรี',
      name_en: 'Kanchanaburi',
      slug: 'kanchanaburi',
    },
    min_price: 800,
    max_price: 1200,
    average_rating: 4.2,
    review_count: 56,
    check_in_time: '14:00',
    check_out_time: '12:00',
    photos: [],
    amenities: [
      { id: 'amenity-8', slug: 'electricity', name_en: 'Electricity', name_th: 'ไฟฟ้า', icon: 'zap', category: 'basic' },
      { id: 'amenity-9', slug: 'kitchen', name_en: 'Kitchen', name_th: 'ครัว', icon: 'kitchen', category: 'facility' },
    ],
    status: 'published',
    is_featured: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    contact_phone: '',
    contact_email: '',
    latitude: 0,
    longitude: 0,
    owner_id: '',
  };

  describe('Table Structure with Multiple Campsites', () => {
    it('renders table with correct number of columns for 2 campsites', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      const campsite1Name = screen.getByText('Mountain View Camping');
      const campsite2Name = screen.getByText('Beach Paradise Glamping');

      expect(campsite1Name).toBeInTheDocument();
      expect(campsite2Name).toBeInTheDocument();
    });

    it('renders table with correct number of columns for 3 campsites', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('Beach Paradise Glamping')).toBeInTheDocument();
      expect(screen.getByText('Forest Cabin Retreat')).toBeInTheDocument();
    });

    it('renders campsite images in header columns', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      const image1 = screen.getByAltText('Mountain View Camping');
      const image2 = screen.getByAltText('Beach Paradise Glamping');

      expect(image1).toHaveAttribute('src', 'https://example.com/photo1.jpg');
      expect(image2).toHaveAttribute('src', 'https://example.com/photo2.jpg');
    });

    it('renders placeholder when campsite has no photos', () => {
      render(<ComparisonTable campsites={[mockCampsite3]} />);

      expect(screen.getByText('No image')).toBeInTheDocument();
      expect(screen.queryByAltText('Forest Cabin Retreat')).not.toBeInTheDocument();
    });
  });

  describe('Comparison Row Rendering', () => {
    it('displays Type row with correct values', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Camping')).toBeInTheDocument();
      expect(screen.getByText('Glamping')).toBeInTheDocument();
      expect(screen.getByText('Cabin')).toBeInTheDocument();
    });

    it('displays Province row with correct values', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Province')).toBeInTheDocument();
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
      expect(screen.getByText('Phuket')).toBeInTheDocument();
      expect(screen.getByText('Kanchanaburi')).toBeInTheDocument();
    });

    it('displays Price Range row with correct formatting', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('500 - 1,500 THB')).toBeInTheDocument();
      expect(screen.getByText('2,000 THB')).toBeInTheDocument();
      expect(screen.getByText('800 - 1,200 THB')).toBeInTheDocument();
    });

    it('displays Rating row with review counts', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('4.5 (123 reviews)')).toBeInTheDocument();
      expect(screen.getByText('4.8 (87 reviews)')).toBeInTheDocument();
      expect(screen.getByText('4.2 (56 reviews)')).toBeInTheDocument();
    });

    it('displays Check-in row with correct times', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Check-in')).toBeInTheDocument();
      const checkinCells = screen.getAllByText(/14:00|15:00/);
      expect(checkinCells.length).toBeGreaterThan(0);
    });

    it('displays Check-out row with correct times', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      expect(screen.getByText('Check-out')).toBeInTheDocument();
      const checkoutCells = screen.getAllByText(/11:00|12:00/);
      expect(checkoutCells.length).toBeGreaterThan(0);
    });
  });

  describe('Amenities Section', () => {
    it('displays Amenities section header', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      expect(screen.getByText('Amenities')).toBeInTheDocument();
    });

    it('displays all amenity rows', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Air Conditioning')).toBeInTheDocument();
      expect(screen.getByText('Hot Water')).toBeInTheDocument();
      expect(screen.getByText('Private Bathroom')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Parking')).toBeInTheDocument();
    });

    it('shows checkmark icon for available amenities', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1]} />);

      // WiFi is available in mockCampsite1
      const checkIcons = container.querySelectorAll('.text-green-500');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('shows X icon for unavailable amenities', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1]} />);

      // Air Conditioning is NOT available in mockCampsite1
      const xIcons = container.querySelectorAll('.text-gray-300');
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it('correctly identifies WiFi amenity in campsite1', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      // Both campsites have WiFi
      const greenChecks = container.querySelectorAll('.text-green-500');
      expect(greenChecks.length).toBeGreaterThan(0);
    });

    it('correctly identifies missing amenities with X icon', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite3]} />);

      // mockCampsite3 is missing most amenities
      const grayX = container.querySelectorAll('.text-gray-300');
      expect(grayX.length).toBeGreaterThan(0);
    });
  });

  describe('View Details Buttons', () => {
    it('renders View Details button for each campsite', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons).toHaveLength(3);
    });

    it('View Details buttons link to correct campsite pages', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      const links = screen.getAllByRole('link', { name: 'View Details' });
      expect(links[0]).toHaveAttribute('href', '/campsites/campsite-001');
      expect(links[1]).toHaveAttribute('href', '/campsites/campsite-002');
    });

    it('renders View Details button for 2 campsites', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons).toHaveLength(2);
    });
  });

  describe('Handling Missing and Null Data', () => {
    it('handles campsite with null province gracefully', () => {
      const campsiteNoProvince: CampsiteDetail = {
        ...mockCampsite1,
        province: null,
      };

      render(<ComparisonTable campsites={[campsiteNoProvince]} />);

      expect(screen.getByText('Province')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('handles campsite with null prices gracefully', () => {
      const campsiteNoPrices: CampsiteDetail = {
        ...mockCampsite1,
        min_price: null,
        max_price: null,
      };

      render(<ComparisonTable campsites={[campsiteNoPrices]} />);

      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('0 THB')).toBeInTheDocument();
    });

    it('handles campsite with null rating gracefully', () => {
      const campsiteNoRating: CampsiteDetail = {
        ...mockCampsite1,
        average_rating: null,
        review_count: null,
      };

      render(<ComparisonTable campsites={[campsiteNoRating]} />);

      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('0.0 (0 reviews)')).toBeInTheDocument();
    });

    it('handles campsite with no amenities gracefully', () => {
      const campsiteNoAmenities: CampsiteDetail = {
        ...mockCampsite1,
        amenities: [],
      };

      const { container } = render(<ComparisonTable campsites={[campsiteNoAmenities]} />);

      // All amenities should show X icons
      const xIcons = container.querySelectorAll('.text-gray-300');
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it('handles campsite with undefined amenities gracefully', () => {
      const campsiteUndefinedAmenities: CampsiteDetail = {
        ...mockCampsite1,
        amenities: undefined,
      };

      const { container } = render(<ComparisonTable campsites={[campsiteUndefinedAmenities]} />);

      // All amenities should show X icons
      const xIcons = container.querySelectorAll('.text-gray-300');
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it('uses default check-in time when not provided', () => {
      const campsiteNoCheckin: CampsiteDetail = {
        ...mockCampsite1,
        check_in_time: null,
      };

      render(<ComparisonTable campsites={[campsiteNoCheckin]} />);

      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    it('uses default check-out time when not provided', () => {
      const campsiteNoCheckout: CampsiteDetail = {
        ...mockCampsite1,
        check_out_time: null,
      };

      render(<ComparisonTable campsites={[campsiteNoCheckout]} />);

      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    it('handles empty photos array with placeholder', () => {
      render(<ComparisonTable campsites={[mockCampsite3]} />);

      expect(screen.getByText('No image')).toBeInTheDocument();
    });

    it('handles campsite with no photos array', () => {
      const campsiteNoPhotos: CampsiteDetail = {
        ...mockCampsite1,
        photos: undefined,
      };

      render(<ComparisonTable campsites={[campsiteNoPhotos]} />);

      expect(screen.getByText('No image')).toBeInTheDocument();
    });
  });

  describe('Table Layout and Styling', () => {
    it('renders table with overflow wrapper', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2]} />);

      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies correct styling to header cells', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1]} />);

      const headerCells = container.querySelectorAll('th.bg-gray-50');
      expect(headerCells.length).toBeGreaterThan(0);
    });

    it('applies correct styling to row labels', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1]} />);

      const labelCells = container.querySelectorAll('td.bg-gray-50');
      expect(labelCells.length).toBeGreaterThan(0);
    });

    it('applies border styling to table rows', () => {
      const { container } = render(<ComparisonTable campsites={[mockCampsite1]} />);

      const borderedRows = container.querySelectorAll('.border-t');
      expect(borderedRows.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single campsite comparison', () => {
      render(<ComparisonTable campsites={[mockCampsite1]} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Camping')).toBeInTheDocument();
    });

    it('handles campsite with all null optional fields', () => {
      const minimalCampsite: CampsiteDetail = {
        id: 'minimal-001',
        name: 'Minimal Campsite',
        slug: 'minimal',
        campsite_type: 'camping',
        description: '',
        province: null,
        min_price: null,
        max_price: null,
        average_rating: null,
        review_count: null,
        check_in_time: null,
        check_out_time: null,
        photos: [],
        amenities: [],
        status: 'published',
        is_featured: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        contact_phone: '',
        contact_email: '',
        latitude: 0,
        longitude: 0,
        owner_id: '',
      };

      render(<ComparisonTable campsites={[minimalCampsite]} />);

      expect(screen.getByText('Minimal Campsite')).toBeInTheDocument();
      expect(screen.getByText('No image')).toBeInTheDocument();
    });

    it('renders correctly with maximum 3 campsites', () => {
      render(<ComparisonTable campsites={[mockCampsite1, mockCampsite2, mockCampsite3]} />);

      const campsiteNames = [
        'Mountain View Camping',
        'Beach Paradise Glamping',
        'Forest Cabin Retreat',
      ];

      campsiteNames.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });
});
