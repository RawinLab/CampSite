import { generateMetadata } from '@/app/campsites/[id]/page';
import type { Metadata } from 'next';
import type { CampsiteDetail } from '@campsite/shared';

// Mock modules
jest.mock('@/lib/seo/utils', () => ({
  generateDescription: jest.fn((text: string) => text.slice(0, 160)),
  generateCampsiteKeywords: jest.fn((campsite: any) => [
    'camping',
    'thailand',
    campsite.name,
    campsite.campsite_type,
    campsite.province.name_en,
  ]),
  SITE_CONFIG: {
    siteName: 'Camping Thailand',
    twitterHandle: '@campingthailand',
  },
}));

jest.mock('@/lib/seo/canonical', () => ({
  getCampsiteCanonicalUrl: jest.fn((id: string) => `https://campingthailand.com/campsites/${id}`),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Campsite Detail Page - Metadata Generation', () => {
  const mockCampsite: CampsiteDetail = {
    id: 'campsite-001',
    slug: 'mountain-view-camping',
    name: 'Mountain View Camping',
    description:
      'Beautiful camping site with stunning mountain views and fresh air. Perfect for families and nature lovers.',
    address: '123 Mountain Road',
    latitude: 18.7883,
    longitude: 98.9853,
    phone: '+66-123456789',
    email: 'info@mountainview.com',
    website: 'https://mountainview.com',
    campsite_type: 'camping',
    province: {
      id: 1,
      name_th: 'เชียงใหม่',
      name_en: 'Chiang Mai',
      slug: 'chiang-mai',
    },
    min_price: 500,
    max_price: 1500,
    check_in_time: '14:00',
    check_out_time: '12:00',
    average_rating: 4.5,
    review_count: 123,
    status: 'approved',
    is_featured: false,
    owner_id: 'owner-001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    photos: [
      {
        id: 'photo-001',
        campsite_id: 'campsite-001',
        url: 'https://example.com/photo1.jpg',
        alt_text: 'Mountain view from campsite',
        is_primary: true,
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'photo-002',
        campsite_id: 'campsite-001',
        url: 'https://example.com/photo2.jpg',
        alt_text: 'Tent setup area',
        is_primary: false,
        display_order: 2,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    amenities: [
      { id: 'amenity-001', name_en: 'WiFi', name_th: 'ไวไฟ', icon_name: 'wifi', category: 'basic' },
      {
        id: 'amenity-002',
        name_en: 'Parking',
        name_th: 'ที่จอดรถ',
        icon_name: 'parking',
        category: 'basic',
      },
    ],
    recent_reviews: [
      {
        id: 'review-001',
        campsite_id: 'campsite-001',
        user_id: 'user-001',
        rating_overall: 5,
        content: 'Amazing place!',
        reviewer_name: 'John Doe',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        rating_cleanliness: 5,
        rating_facilities: 5,
        rating_location: 5,
        rating_staff: 5,
        rating_value: 5,
        is_verified_booking: true,
        moderation_status: 'approved',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata function', () => {
    it('should be defined and callable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata).toBeDefined();
      expect(typeof generateMetadata).toBe('function');
    });

    it('should fetch campsite data with correct URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      await generateMetadata({ params: { id: 'campsite-001' } });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/campsites/campsite-001'),
        expect.objectContaining({
          next: { revalidate: 60 },
        })
      );
    });
  });

  describe('Metadata - Title', () => {
    it('should include campsite name in title', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.title).toBe('Mountain View Camping');
    });

    it('should return "ไม่พบแคมป์ไซต์" when campsite not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const metadata = await generateMetadata({ params: { id: 'nonexistent' } });

      expect(metadata.title).toBe('ไม่พบแคมป์ไซต์');
    });
  });

  describe('Metadata - Description', () => {
    it('should use campsite description when available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.description).toBeDefined();
      expect(metadata.description).toContain('Beautiful camping site');
    });

    it('should generate fallback description when description is null', async () => {
      const campsiteWithoutDescription = {
        ...mockCampsite,
        description: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteWithoutDescription }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.description).toBeDefined();
      expect(metadata.description).toContain('Mountain View Camping');
      expect(metadata.description).toContain('เชียงใหม่');
      expect(metadata.description).toContain('14:00');
      expect(metadata.description).toContain('12:00');
      expect(metadata.description).toContain('฿500');
    });

    it('should generate fallback description when description is empty', async () => {
      const campsiteWithEmptyDescription = {
        ...mockCampsite,
        description: '',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteWithEmptyDescription }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.description).toBeDefined();
      expect(metadata.description).toContain('Mountain View Camping');
    });

    it('should include error description when campsite not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const metadata = await generateMetadata({ params: { id: 'nonexistent' } });

      expect(metadata.description).toBe('ไม่พบแคมป์ไซต์ที่คุณกำลังค้นหา กรุณาลองค้นหาใหม่อีกครั้ง');
    });
  });

  describe('Metadata - Keywords', () => {
    it('should generate keywords from campsite data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.keywords).toBeDefined();
      expect(Array.isArray(metadata.keywords)).toBe(true);
      expect(metadata.keywords).toContain('camping');
      expect(metadata.keywords).toContain('thailand');
      expect(metadata.keywords).toContain('Mountain View Camping');
    });
  });

  describe('Metadata - Open Graph', () => {
    it('should include correct Open Graph title', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('Mountain View Camping');
    });

    it('should include correct Open Graph description', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.description).toContain('Beautiful camping site');
    });

    it('should include correct Open Graph metadata properties', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.openGraph?.type).toBe('website');
      expect(metadata.openGraph?.locale).toBe('th_TH');
      expect(metadata.openGraph?.siteName).toBe('Camping Thailand');
      expect(metadata.openGraph?.url).toBe('https://campingthailand.com/campsites/campsite-001');
    });

    it('should include primary photo in Open Graph images', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.openGraph?.images).toBeDefined();
      expect(Array.isArray(metadata.openGraph?.images)).toBe(true);
      expect(metadata.openGraph?.images).toHaveLength(1);

      const image = (metadata.openGraph?.images as any[])[0];
      expect(image.url).toBe('https://example.com/photo1.jpg');
      expect(image.width).toBe(1200);
      expect(image.height).toBe(630);
      expect(image.alt).toBe('Mountain view from campsite');
    });

    it('should use first photo when no primary photo is set', async () => {
      const campsiteNoPrimary = {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteNoPrimary }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      const image = (metadata.openGraph?.images as any[])[0];
      expect(image.url).toBe('https://example.com/first.jpg');
      expect(image.alt).toBe('First photo');
    });

    it('should use campsite name as alt text when photo alt_text is null', async () => {
      const campsiteNoAlt = {
        ...mockCampsite,
        photos: [
          {
            id: 'photo-001',
            campsite_id: 'campsite-001',
            url: 'https://example.com/photo.jpg',
            alt_text: null,
            is_primary: true,
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteNoAlt }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      const image = (metadata.openGraph?.images as any[])[0];
      expect(image.alt).toBe('Mountain View Camping');
    });

    it('should have empty images array when no photos', async () => {
      const campsiteNoPhotos = {
        ...mockCampsite,
        photos: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteNoPhotos }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.openGraph?.images).toEqual([]);
    });
  });

  describe('Metadata - Twitter Card', () => {
    it('should include correct Twitter card metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('Mountain View Camping');
      expect(metadata.twitter?.description).toContain('Beautiful camping site');
      expect(metadata.twitter?.site).toBe('@campingthailand');
    });

    it('should include photo URL in Twitter images', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.twitter?.images).toBeDefined();
      expect(Array.isArray(metadata.twitter?.images)).toBe(true);
      expect(metadata.twitter?.images).toContain('https://example.com/photo1.jpg');
    });

    it('should have empty Twitter images array when no photos', async () => {
      const campsiteNoPhotos = {
        ...mockCampsite,
        photos: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: campsiteNoPhotos }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.twitter?.images).toEqual([]);
    });
  });

  describe('Metadata - Canonical URL', () => {
    it('should include canonical URL in alternates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.canonical).toBe(
        'https://campingthailand.com/campsites/campsite-001'
      );
    });
  });

  describe('Metadata - Additional Meta Tags', () => {
    it('should include price metadata in other tags', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.other).toBeDefined();
      expect(metadata.other?.['og:price:amount']).toBe('500');
      expect(metadata.other?.['og:price:currency']).toBe('THB');
    });
  });

  describe('Metadata - Robots', () => {
    it('should set noindex for not found campsite', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const metadata = await generateMetadata({ params: { id: 'nonexistent' } });

      expect(metadata.robots).toBeDefined();
      expect((metadata.robots as any).index).toBe(false);
      expect((metadata.robots as any).follow).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.title).toBe('ไม่พบแคมป์ไซต์');
      expect((metadata.robots as any).index).toBe(false);
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.title).toBe('ไม่พบแคมป์ไซต์');
    });

    it('should handle response with success: false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, data: null }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.title).toBe('ไม่พบแคมป์ไซต์');
    });
  });

  describe('Data Completeness', () => {
    it('should handle campsite with minimal data', async () => {
      const minimalCampsite = {
        id: 'campsite-002',
        name: 'Basic Camp',
        campsite_type: 'camping',
        province: {
          id: 1,
          name_th: 'กรุงเทพ',
          name_en: 'Bangkok',
          slug: 'bangkok',
        },
        min_price: 300,
        max_price: 300,
        check_in_time: '14:00',
        check_out_time: '12:00',
        status: 'approved',
        is_featured: false,
        owner_id: 'owner-001',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        photos: [],
        amenities: [],
        recent_reviews: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: minimalCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-002' } });

      expect(metadata.title).toBe('Basic Camp');
      expect(metadata.description).toBeDefined();
      expect(metadata.openGraph?.images).toEqual([]);
      expect(metadata.twitter?.images).toEqual([]);
    });

    it('should handle large price numbers correctly', async () => {
      const expensiveCampsite = {
        ...mockCampsite,
        min_price: 10000,
        max_price: 25000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: expensiveCampsite }),
      });

      const metadata = await generateMetadata({ params: { id: 'campsite-001' } });

      expect(metadata.other?.['og:price:amount']).toBe('10000');
    });
  });
});
