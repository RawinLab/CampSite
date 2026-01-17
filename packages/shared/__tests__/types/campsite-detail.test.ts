/**
 * TypeScript compilation tests for campsite detail types
 *
 * This test file verifies that:
 * 1. Type definitions compile correctly
 * 2. Optional fields are properly typed
 * 3. Nested types (province, photos, amenities, etc.) compile
 * 4. Type narrowing works correctly
 *
 * These are compile-time checks ensuring types don't have errors.
 */

import type {
  CampsiteDetail,
  CampsiteDetailResponse,
  CampsitePhoto,
  AccommodationType,
  NearbyAttraction,
  CampsiteReview,
  ReviewSummary,
  CampsiteOwner,
  ReviewerType,
  AttractionCategory,
  DifficultyLevel,
  ReviewPhoto,
} from '../../src/types/campsite-detail';
import type { Campsite, Province, Amenity, CampsiteStatus, CampsiteType } from '../../src/types/campsite';

describe('Campsite Detail Types - Compilation Tests', () => {
  describe('ReviewerType', () => {
    it('should accept valid reviewer types', () => {
      const types: ReviewerType[] = ['family', 'couple', 'solo', 'group'];
      expect(types).toHaveLength(4);

      // Type compilation check - verifies the type exists and compiles
      const reviewerType: ReviewerType = 'family';
      expect(reviewerType).toBe('family');
    });
  });

  describe('AttractionCategory', () => {
    it('should accept valid attraction categories', () => {
      const categories: AttractionCategory[] = [
        'hiking', 'waterfall', 'temple', 'viewpoint',
        'lake', 'cave', 'market', 'other'
      ];
      expect(categories).toHaveLength(8);

      // Type compilation check
      const category: AttractionCategory = 'hiking';
      expect(category).toBe('hiking');
    });
  });

  describe('DifficultyLevel', () => {
    it('should accept valid difficulty levels', () => {
      const levels: DifficultyLevel[] = ['easy', 'moderate', 'hard'];
      expect(levels).toHaveLength(3);

      // Type compilation check
      const level: DifficultyLevel = 'moderate';
      expect(level).toBe('moderate');
    });
  });

  describe('CampsitePhoto', () => {
    it('should compile with all required fields', () => {
      const photo: CampsitePhoto = {
        id: 'photo-1',
        campsite_id: 'campsite-1',
        url: 'https://example.com/photo.jpg',
        alt_text: 'Beautiful campsite view',
        is_primary: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(photo.id).toBe('photo-1');
      // Type compilation checks - ensure types compile
      const altText: string | null = photo.alt_text;
      const isPrimary: boolean = photo.is_primary;
      expect(typeof isPrimary).toBe('boolean');
    });

    it('should allow null alt_text', () => {
      const photo: CampsitePhoto = {
        id: 'photo-2',
        campsite_id: 'campsite-1',
        url: 'https://example.com/photo.jpg',
        alt_text: null,
        is_primary: false,
        sort_order: 2,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(photo.alt_text).toBeNull();
    });
  });

  describe('AccommodationType', () => {
    it('should compile with all required fields', () => {
      const accommodation: AccommodationType = {
        id: 'acc-1',
        campsite_id: 'campsite-1',
        name: 'Tent Site',
        description: 'Spacious tent area',
        capacity: 4,
        price_per_night: 500,
        price_weekend: 700,
        amenities_included: ['wifi', 'power'],
        sort_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(accommodation.name).toBe('Tent Site');
      // Type compilation checks
      const description: string | null = accommodation.description;
      const priceWeekend: number | null = accommodation.price_weekend;
      const amenities: string[] = accommodation.amenities_included;
      expect(Array.isArray(amenities)).toBe(true);
    });

    it('should allow null optional fields', () => {
      const accommodation: AccommodationType = {
        id: 'acc-2',
        campsite_id: 'campsite-1',
        name: 'RV Site',
        description: null,
        capacity: 2,
        price_per_night: 1000,
        price_weekend: null,
        amenities_included: [],
        sort_order: 2,
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(accommodation.description).toBeNull();
      expect(accommodation.price_weekend).toBeNull();
    });
  });

  describe('NearbyAttraction', () => {
    it('should compile with all required fields', () => {
      const attraction: NearbyAttraction = {
        id: 'attr-1',
        campsite_id: 'campsite-1',
        name: 'Mountain Trail',
        description: 'Scenic hiking trail',
        distance_km: 2.5,
        category: 'hiking',
        difficulty: 'moderate',
        latitude: 13.7563,
        longitude: 100.5018,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(attraction.name).toBe('Mountain Trail');
      // Type compilation checks
      const category: AttractionCategory = attraction.category;
      const difficulty: DifficultyLevel | null = attraction.difficulty;
      const latitude: number | null = attraction.latitude;
      expect(category).toBe('hiking');
    });

    it('should allow null optional fields', () => {
      const attraction: NearbyAttraction = {
        id: 'attr-2',
        campsite_id: 'campsite-1',
        name: 'Local Market',
        description: null,
        distance_km: 1.0,
        category: 'market',
        difficulty: null,
        latitude: null,
        longitude: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(attraction.difficulty).toBeNull();
      expect(attraction.latitude).toBeNull();
    });
  });

  describe('ReviewPhoto', () => {
    it('should compile with all required fields', () => {
      const reviewPhoto: ReviewPhoto = {
        id: 'rp-1',
        review_id: 'review-1',
        url: 'https://example.com/review-photo.jpg',
        sort_order: 1,
      };

      expect(reviewPhoto.id).toBe('rp-1');
      // Type compilation check
      const sortOrder: number = reviewPhoto.sort_order;
      expect(typeof sortOrder).toBe('number');
    });
  });

  describe('CampsiteReview', () => {
    it('should compile with all required fields', () => {
      const review: CampsiteReview = {
        id: 'review-1',
        campsite_id: 'campsite-1',
        user_id: 'user-1',
        rating_overall: 4.5,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 4,
        rating_value: 5,
        reviewer_type: 'family',
        title: 'Great experience',
        content: 'Had a wonderful time with family',
        helpful_count: 10,
        is_reported: false,
        is_hidden: false,
        visited_at: '2024-01-01',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      expect(review.rating_overall).toBe(4.5);
      // Type compilation checks
      const reviewerType: ReviewerType = review.reviewer_type;
      const ratingCleanliness: number | null = review.rating_cleanliness;
      const title: string | null = review.title;
      expect(reviewerType).toBe('family');
    });

    it('should allow null optional rating fields', () => {
      const review: CampsiteReview = {
        id: 'review-2',
        campsite_id: 'campsite-1',
        user_id: 'user-2',
        rating_overall: 3.0,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        reviewer_type: 'solo',
        title: null,
        content: 'Basic review',
        helpful_count: 0,
        is_reported: false,
        is_hidden: false,
        visited_at: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      expect(review.rating_cleanliness).toBeNull();
      expect(review.title).toBeNull();
    });

    it('should allow optional joined data fields', () => {
      const review: CampsiteReview = {
        id: 'review-3',
        campsite_id: 'campsite-1',
        user_id: 'user-3',
        rating_overall: 5,
        rating_cleanliness: 5,
        rating_staff: 5,
        rating_facilities: 5,
        rating_value: 5,
        reviewer_type: 'couple',
        title: 'Perfect!',
        content: 'Amazing place',
        helpful_count: 20,
        is_reported: false,
        is_hidden: false,
        visited_at: '2024-01-01',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        reviewer_name: 'John Doe',
        reviewer_avatar: 'https://example.com/avatar.jpg',
        photos: [
          { id: 'rp-1', review_id: 'review-3', url: 'photo1.jpg', sort_order: 1 },
          { id: 'rp-2', review_id: 'review-3', url: 'photo2.jpg', sort_order: 2 },
        ],
      };

      expect(review.reviewer_name).toBe('John Doe');
      // Type compilation checks for optional joined data
      const reviewerName: string | undefined = review.reviewer_name;
      const reviewerAvatar: string | null | undefined = review.reviewer_avatar;
      const reviewPhotos: ReviewPhoto[] | undefined = review.photos;
      expect(reviewerName).toBe('John Doe');
    });
  });

  describe('ReviewSummary', () => {
    it('should compile with all required fields', () => {
      const summary: ReviewSummary = {
        average_rating: 4.3,
        total_count: 50,
        rating_distribution: {
          1: 2,
          2: 3,
          3: 10,
          4: 20,
          5: 15,
        },
        category_averages: {
          cleanliness: 4.5,
          staff: 4.2,
          facilities: 4.1,
          value: 4.4,
        },
      };

      expect(summary.average_rating).toBe(4.3);
      // Type compilation checks
      const ratingDist: { 1: number; 2: number; 3: number; 4: number; 5: number } = summary.rating_distribution;
      const cleanliness: number | null = summary.category_averages.cleanliness;
      expect(ratingDist[5]).toBe(15);
    });

    it('should allow null category averages', () => {
      const summary: ReviewSummary = {
        average_rating: 3.0,
        total_count: 1,
        rating_distribution: {
          1: 0,
          2: 0,
          3: 1,
          4: 0,
          5: 0,
        },
        category_averages: {
          cleanliness: null,
          staff: null,
          facilities: null,
          value: null,
        },
      };

      expect(summary.category_averages.cleanliness).toBeNull();
    });
  });

  describe('CampsiteOwner', () => {
    it('should compile with all required fields', () => {
      const owner: CampsiteOwner = {
        id: 'owner-1',
        full_name: 'Jane Smith',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(owner.full_name).toBe('Jane Smith');
      // Type compilation check
      const avatarUrl: string | null = owner.avatar_url;
      expect(avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should allow null avatar_url', () => {
      const owner: CampsiteOwner = {
        id: 'owner-2',
        full_name: 'John Doe',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(owner.avatar_url).toBeNull();
    });
  });

  describe('CampsiteDetail', () => {
    it('should extend Campsite and compile with all fields', () => {
      const detail: CampsiteDetail = {
        // Base Campsite fields
        id: 'campsite-1',
        owner_id: 'owner-1',
        name: 'Mountain View Campsite',
        description: 'Beautiful mountain campsite',
        province_id: 1,
        address: '123 Mountain Road',
        latitude: 13.7563,
        longitude: 100.5018,
        campsite_type: 'camping',
        status: 'approved',
        is_featured: true,
        average_rating: 4.5,
        review_count: 50,
        min_price: 500,
        max_price: 1500,
        check_in_time: '14:00',
        check_out_time: '11:00',
        phone: '0812345678',
        email: 'info@campsite.com',
        website: 'https://campsite.com',
        booking_url: 'https://booking.campsite.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // CampsiteDetail specific fields
        province: {
          id: 1,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
          region: 'north',
        },
        owner: {
          id: 'owner-1',
          full_name: 'Jane Smith',
          avatar_url: 'https://example.com/avatar.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
        photos: [
          {
            id: 'photo-1',
            campsite_id: 'campsite-1',
            url: 'https://example.com/photo1.jpg',
            alt_text: 'Main view',
            is_primary: true,
            sort_order: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        amenities: [
          {
            id: 1,
            name_th: 'Wi-Fi',
            name_en: 'Wi-Fi',
            slug: 'wifi',
            icon: 'wifi',
            category: 'connectivity',
            sort_order: 1,
          },
        ],
        accommodation_types: [
          {
            id: 'acc-1',
            campsite_id: 'campsite-1',
            name: 'Tent Site',
            description: 'Basic tent area',
            capacity: 4,
            price_per_night: 500,
            price_weekend: 700,
            amenities_included: ['wifi'],
            sort_order: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        nearby_attractions: [
          {
            id: 'attr-1',
            campsite_id: 'campsite-1',
            name: 'Mountain Trail',
            description: 'Hiking trail',
            distance_km: 2.5,
            category: 'hiking',
            difficulty: 'moderate',
            latitude: 13.7563,
            longitude: 100.5018,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        review_summary: {
          average_rating: 4.5,
          total_count: 50,
          rating_distribution: { 1: 0, 2: 0, 3: 5, 4: 20, 5: 25 },
          category_averages: {
            cleanliness: 4.6,
            staff: 4.5,
            facilities: 4.4,
            value: 4.7,
          },
        },
        recent_reviews: [
          {
            id: 'review-1',
            campsite_id: 'campsite-1',
            user_id: 'user-1',
            rating_overall: 5,
            rating_cleanliness: 5,
            rating_staff: 5,
            rating_facilities: 4,
            rating_value: 5,
            reviewer_type: 'family',
            title: 'Excellent!',
            content: 'Great place',
            helpful_count: 10,
            is_reported: false,
            is_hidden: false,
            visited_at: '2024-01-01',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        facebook_url: 'https://facebook.com/campsite',
        instagram_url: 'https://instagram.com/campsite',
      };

      expect(detail.name).toBe('Mountain View Campsite');

      // Type compilation checks - verify CampsiteDetail extends Campsite
      const baseData: Campsite = detail;
      expect(baseData.id).toBe('campsite-1');

      // Verify nested types compile correctly
      const province: Province = detail.province;
      const owner: CampsiteOwner | null = detail.owner;
      const photos: CampsitePhoto[] = detail.photos;
      const amenities: Amenity[] = detail.amenities;
      const accommodationTypes: AccommodationType[] = detail.accommodation_types;
      const nearbyAttractions: NearbyAttraction[] = detail.nearby_attractions;
      const reviewSummary: ReviewSummary = detail.review_summary;
      const recentReviews: CampsiteReview[] = detail.recent_reviews;
      const facebookUrl: string | null = detail.facebook_url;
      const instagramUrl: string | null = detail.instagram_url;

      expect(province.name_en).toBe('Chiang Mai');
    });

    it('should allow null owner', () => {
      const detail: CampsiteDetail = {
        id: 'campsite-2',
        owner_id: 'owner-2',
        name: 'Test Campsite',
        description: 'Test description',
        province_id: 1,
        address: '123 Test Road',
        latitude: 13.7563,
        longitude: 100.5018,
        campsite_type: 'glamping',
        status: 'pending',
        is_featured: false,
        average_rating: 0,
        review_count: 0,
        min_price: 1000,
        max_price: 2000,
        check_in_time: '14:00',
        check_out_time: '11:00',
        phone: null,
        email: null,
        website: null,
        booking_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        province: {
          id: 1,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
          region: 'north',
        },
        owner: null,
        photos: [],
        amenities: [],
        accommodation_types: [],
        nearby_attractions: [],
        review_summary: {
          average_rating: 0,
          total_count: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          category_averages: {
            cleanliness: null,
            staff: null,
            facilities: null,
            value: null,
          },
        },
        recent_reviews: [],
        facebook_url: null,
        instagram_url: null,
      };

      expect(detail.owner).toBeNull();
    });

    it('should verify CampsiteType and CampsiteStatus are properly typed', () => {
      const validTypes: CampsiteType[] = [
        'camping', 'glamping', 'tented-resort',
        'bungalow', 'cabin', 'rv-caravan'
      ];

      const validStatuses: CampsiteStatus[] = [
        'pending', 'approved', 'rejected', 'archived'
      ];

      expect(validTypes).toHaveLength(6);
      expect(validStatuses).toHaveLength(4);
    });
  });

  describe('CampsiteDetailResponse', () => {
    it('should compile with successful response', () => {
      const response: CampsiteDetailResponse = {
        success: true,
        data: {
          id: 'campsite-1',
          owner_id: 'owner-1',
          name: 'Test Campsite',
          description: 'Test',
          province_id: 1,
          address: '123 Test',
          latitude: 13.7563,
          longitude: 100.5018,
          campsite_type: 'camping',
          status: 'approved',
          is_featured: false,
          average_rating: 0,
          review_count: 0,
          min_price: 500,
          max_price: 1500,
          check_in_time: '14:00',
          check_out_time: '11:00',
          phone: null,
          email: null,
          website: null,
          booking_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          province: {
            id: 1,
            name_th: 'เชียงใหม่',
            name_en: 'Chiang Mai',
            slug: 'chiang-mai',
            region: 'north',
          },
          owner: null,
          photos: [],
          amenities: [],
          accommodation_types: [],
          nearby_attractions: [],
          review_summary: {
            average_rating: 0,
            total_count: 0,
            rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            category_averages: {
              cleanliness: null,
              staff: null,
              facilities: null,
              value: null,
            },
          },
          recent_reviews: [],
          facebook_url: null,
          instagram_url: null,
        },
      };

      expect(response.success).toBe(true);
      // Type compilation checks
      const data: CampsiteDetail | null = response.data;
      const error: string | undefined = response.error;
      expect(data).toBeDefined();
    });

    it('should compile with error response', () => {
      const response: CampsiteDetailResponse = {
        success: false,
        data: null,
        error: 'Campsite not found',
      };

      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error).toBe('Campsite not found');
    });
  });

  describe('Type narrowing', () => {
    it('should narrow CampsiteDetailResponse based on success flag', () => {
      const response: CampsiteDetailResponse = {
        success: true,
        data: null,
      };

      if (response.success && response.data) {
        // Type should be narrowed to CampsiteDetail here
        const detail: CampsiteDetail = response.data;
        expect(detail.name).toBeDefined();
      } else {
        // Type is still CampsiteDetail | null
        const data: CampsiteDetail | null = response.data;
        expect(data).toBeNull();
      }
    });

    it('should narrow optional reviewer type fields', () => {
      const review: CampsiteReview = {
        id: 'review-1',
        campsite_id: 'campsite-1',
        user_id: 'user-1',
        rating_overall: 4,
        rating_cleanliness: 4,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        reviewer_type: 'family',
        title: 'Good',
        content: 'Nice place',
        helpful_count: 5,
        is_reported: false,
        is_hidden: false,
        visited_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      if (review.rating_cleanliness !== null) {
        // Type narrowing - should be number here
        const rating: number = review.rating_cleanliness;
        expect(rating).toBeGreaterThanOrEqual(0);
      }
    });

    it('should narrow attraction difficulty', () => {
      const attraction: NearbyAttraction = {
        id: 'attr-1',
        campsite_id: 'campsite-1',
        name: 'Trail',
        description: null,
        distance_km: 1.5,
        category: 'hiking',
        difficulty: 'hard',
        latitude: null,
        longitude: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      if (attraction.difficulty) {
        // Type narrowing - should be DifficultyLevel here
        const level: DifficultyLevel = attraction.difficulty;
        const validLevels: DifficultyLevel[] = ['easy', 'moderate', 'hard'];
        expect(validLevels).toContain(level);
      }
    });
  });

  describe('Array types', () => {
    it('should properly type photos array', () => {
      const photos: CampsitePhoto[] = [];

      photos.push({
        id: 'p1',
        campsite_id: 'c1',
        url: 'url',
        alt_text: null,
        is_primary: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
      });

      expect(photos).toHaveLength(1);
    });

    it('should properly type accommodation types array', () => {
      const accommodations: AccommodationType[] = [];

      accommodations.push({
        id: 'a1',
        campsite_id: 'c1',
        name: 'Tent',
        description: null,
        capacity: 2,
        price_per_night: 500,
        price_weekend: null,
        amenities_included: [],
        sort_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      expect(accommodations).toHaveLength(1);
    });

    it('should properly type nearby attractions array', () => {
      const attractions: NearbyAttraction[] = [];

      attractions.push({
        id: 'na1',
        campsite_id: 'c1',
        name: 'Waterfall',
        description: null,
        distance_km: 3.0,
        category: 'waterfall',
        difficulty: null,
        latitude: null,
        longitude: null,
        created_at: '2024-01-01T00:00:00Z',
      });

      expect(attractions).toHaveLength(1);
    });

    it('should properly type reviews array', () => {
      const reviews: CampsiteReview[] = [];

      reviews.push({
        id: 'r1',
        campsite_id: 'c1',
        user_id: 'u1',
        rating_overall: 4,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        reviewer_type: 'solo',
        title: null,
        content: 'Good',
        helpful_count: 0,
        is_reported: false,
        is_hidden: false,
        visited_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      expect(reviews).toHaveLength(1);
    });
  });
});
