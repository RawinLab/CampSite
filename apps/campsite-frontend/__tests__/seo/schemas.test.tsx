import { render } from '@testing-library/react';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { CampsiteSchema } from '@/components/seo/CampsiteSchema';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { ReviewSchema, AggregateRatingSchema } from '@/components/seo/ReviewSchema';

// Mock environment variable
process.env.NEXT_PUBLIC_SITE_URL = 'https://campingthailand.com';

describe('JSON-LD Schema Components', () => {
  describe('OrganizationSchema', () => {
    it('renders valid JSON-LD script with @context and @type', () => {
      const { container } = render(<OrganizationSchema />);
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).toBeInTheDocument();

      const schema = JSON.parse(script?.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
    });

    it('renders organization with correct name', () => {
      const { container } = render(<OrganizationSchema />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.name).toBe('Camping Thailand');
    });

    it('includes logo with ImageObject type', () => {
      const { container } = render(<OrganizationSchema />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.logo).toBeDefined();
      expect(schema.logo['@type']).toBe('ImageObject');
      expect(schema.logo.url).toContain('logo.png');
      expect(schema.logo.width).toBe(512);
      expect(schema.logo.height).toBe(512);
    });

    it('includes contact point with available languages', () => {
      const { container } = render(<OrganizationSchema />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.contactType).toBe('customer service');
      expect(schema.contactPoint.availableLanguage).toEqual(['Thai', 'English']);
    });

    it('includes social media profiles in sameAs array', () => {
      const { container } = render(<OrganizationSchema />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.sameAs)).toBe(true);
      expect(schema.sameAs).toContain('https://www.facebook.com/campingthailand');
      expect(schema.sameAs).toContain('https://www.instagram.com/campingthailand');
      expect(schema.sameAs).toContain('https://twitter.com/campingthailand');
    });

    it('accepts custom name override', () => {
      const { container } = render(<OrganizationSchema name="Custom Name" />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.name).toBe('Custom Name');
    });

    it('accepts additional sameAs URLs', () => {
      const customUrls = ['https://example.com/profile'];
      const { container } = render(<OrganizationSchema sameAs={customUrls} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.sameAs).toContain('https://example.com/profile');
    });
  });

  describe('CampsiteSchema', () => {
    const mockCampsite = {
      id: 'campsite-001',
      slug: 'mountain-view-camping',
      name: 'Mountain View Camping',
      description: 'Beautiful camping with mountain views',
      address: '123 Mountain Road',
      latitude: 18.7883,
      longitude: 98.9853,
      phone: '+66123456789',
      email: 'info@mountainview.com',
      website: 'https://mountainview.com',
      min_price: 500,
      max_price: 1500,
      check_in_time: '14:00',
      check_out_time: '12:00',
      average_rating: 4.5,
      review_count: 123,
      campsite_type: 'camping',
      province: {
        name_en: 'Chiang Mai',
        name_th: 'เชียงใหม่',
      },
      photos: [
        {
          url: 'https://example.com/photo1.jpg',
          alt_text: 'Main view',
          is_primary: true,
        },
        {
          url: 'https://example.com/photo2.jpg',
          alt_text: 'Side view',
          is_primary: false,
        },
      ],
      amenities: [
        { name_en: 'WiFi', name_th: 'ไวไฟ' },
        { name_en: 'Parking', name_th: 'ที่จอดรถ' },
      ],
    };

    it('renders valid JSON-LD script with @context and @type', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).toBeInTheDocument();

      const schema = JSON.parse(script?.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('LodgingBusiness');
    });

    it('includes complete address with PostalAddress type', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.streetAddress).toBe('123 Mountain Road');
      expect(schema.address.addressRegion).toBe('Chiang Mai');
      expect(schema.address.addressCountry).toBe('TH');
    });

    it('includes geo coordinates with GeoCoordinates type', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.geo).toBeDefined();
      expect(schema.geo['@type']).toBe('GeoCoordinates');
      expect(schema.geo.latitude).toBe(18.7883);
      expect(schema.geo.longitude).toBe(98.9853);
    });

    it('includes aggregateRating when rating data exists', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe('4.5');
      expect(schema.aggregateRating.reviewCount).toBe(123);
      expect(schema.aggregateRating.bestRating).toBe(5);
      expect(schema.aggregateRating.worstRating).toBe(1);
    });

    it('excludes aggregateRating when review_count is zero', () => {
      const campsiteNoReviews = { ...mockCampsite, review_count: 0 };
      const { container } = render(<CampsiteSchema campsite={campsiteNoReviews} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('excludes aggregateRating when rating data is missing', () => {
      const campsiteNoRating = {
        ...mockCampsite,
        average_rating: null,
        review_count: null
      };
      const { container } = render(<CampsiteSchema campsite={campsiteNoRating} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('includes contact information', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.telephone).toBe('+66123456789');
      expect(schema.email).toBe('info@mountainview.com');
    });

    it('includes price range formatted correctly', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.priceRange).toBeDefined();
      expect(schema.priceRange).toContain('500');
      expect(schema.priceRange).toContain('1,500');
    });

    it('includes check-in and check-out times', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.checkinTime).toBe('14:00');
      expect(schema.checkoutTime).toBe('12:00');
    });

    it('includes amenity features as LocationFeatureSpecification', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.amenityFeature).toBeDefined();
      expect(Array.isArray(schema.amenityFeature)).toBe(true);
      expect(schema.amenityFeature[0]['@type']).toBe('LocationFeatureSpecification');
      expect(schema.amenityFeature[0].name).toBe('WiFi');
      expect(schema.amenityFeature[0].value).toBe(true);
    });

    it('includes photos as ImageObject array (max 5)', () => {
      const campsiteWithManyPhotos = {
        ...mockCampsite,
        photos: Array.from({ length: 10 }, (_, i) => ({
          url: `https://example.com/photo${i}.jpg`,
          alt_text: `Photo ${i}`,
          is_primary: i === 0,
        })),
      };

      const { container } = render(<CampsiteSchema campsite={campsiteWithManyPhotos} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.photo).toBeDefined();
      expect(Array.isArray(schema.photo)).toBe(true);
      expect(schema.photo.length).toBe(5); // Limited to 5 photos
      expect(schema.photo[0]['@type']).toBe('ImageObject');
      expect(schema.photo[0].url).toContain('photo0.jpg');
    });

    it('uses primary photo as main image', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.image).toBe('https://example.com/photo1.jpg');
    });

    it('excludes geo when coordinates are missing', () => {
      const campsiteNoGeo = {
        ...mockCampsite,
        latitude: null,
        longitude: null
      };
      const { container } = render(<CampsiteSchema campsite={campsiteNoGeo} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.geo).toBeUndefined();
    });

    it('includes canonical URL with slug', () => {
      const { container } = render(<CampsiteSchema campsite={mockCampsite} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.url).toBe('https://campingthailand.com/campsites/mountain-view-camping');
      expect(schema['@id']).toBe('https://campingthailand.com/campsites/mountain-view-camping');
    });
  });

  describe('BreadcrumbSchema', () => {
    const mockItems = [
      { name: 'ค้นหา', url: '/search' },
      { name: 'เชียงใหม่', url: '/provinces/chiang-mai' },
      { name: 'Mountain View', url: '/campsites/mountain-view' },
    ];

    it('renders valid JSON-LD script with @context and @type', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).toBeInTheDocument();

      const schema = JSON.parse(script?.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
    });

    it('includes itemListElement array with ListItem type', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.itemListElement).toBeDefined();
      expect(Array.isArray(schema.itemListElement)).toBe(true);
      expect(schema.itemListElement[0]['@type']).toBe('ListItem');
    });

    it('always starts with home page', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.itemListElement[0].name).toBe('หน้าหลัก');
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].item).toBe('https://campingthailand.com/');
    });

    it('includes correct positions for all items', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      // Home + 3 items = 4 total
      expect(schema.itemListElement).toHaveLength(4);

      schema.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
      });
    });

    it('converts relative URLs to canonical URLs', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.itemListElement[1].item).toBe('https://campingthailand.com/search');
      expect(schema.itemListElement[2].item).toBe('https://campingthailand.com/provinces/chiang-mai');
    });

    it('preserves absolute URLs', () => {
      const itemsWithAbsolute = [
        { name: 'External', url: 'https://example.com/page' },
      ];

      const { container } = render(<BreadcrumbSchema items={itemsWithAbsolute} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.itemListElement[1].item).toBe('https://example.com/page');
    });

    it('handles empty items array', () => {
      const { container } = render(<BreadcrumbSchema items={[]} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      // Should only have home
      expect(schema.itemListElement).toHaveLength(1);
      expect(schema.itemListElement[0].name).toBe('หน้าหลัก');
    });

    it('includes item names correctly', () => {
      const { container } = render(<BreadcrumbSchema items={mockItems} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.itemListElement[1].name).toBe('ค้นหา');
      expect(schema.itemListElement[2].name).toBe('เชียงใหม่');
      expect(schema.itemListElement[3].name).toBe('Mountain View');
    });
  });

  describe('ReviewSchema', () => {
    const mockReviews = [
      {
        id: 'review-001',
        rating_overall: 5,
        content: 'Excellent campsite with great facilities',
        reviewer_name: 'John Doe',
        created_at: '2024-01-15T10:30:00Z',
        rating_cleanliness: 5,
        rating_facilities: 5,
        rating_location: 4,
        rating_value: 5,
      },
      {
        id: 'review-002',
        rating_overall: 4,
        content: 'Good experience overall',
        reviewer_name: 'Jane Smith',
        created_at: '2024-01-10T14:20:00Z',
        rating_cleanliness: 4,
        rating_facilities: 4,
        rating_location: 4,
        rating_value: 4,
      },
    ];

    const mockItemReviewed = {
      name: 'Mountain View Camping',
      url: '/campsites/mountain-view',
    };

    const mockAggregateRating = {
      ratingValue: 4.5,
      reviewCount: 123,
    };

    it('renders valid JSON-LD script with @context and @type', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
          aggregateRating={mockAggregateRating}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).toBeInTheDocument();

      const schema = JSON.parse(script?.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
    });

    it('includes item reviewed information', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.name).toBe('Mountain View Camping');
      expect(schema.url).toBe('https://campingthailand.com/campsites/mountain-view');
    });

    it('includes aggregate rating when provided', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
          aggregateRating={mockAggregateRating}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe('4.5');
      expect(schema.aggregateRating.reviewCount).toBe(123);
      expect(schema.aggregateRating.bestRating).toBe(5);
      expect(schema.aggregateRating.worstRating).toBe(1);
    });

    it('excludes aggregate rating when not provided', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('includes review array with Review type', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review).toBeDefined();
      expect(Array.isArray(schema.review)).toBe(true);
      expect(schema.review[0]['@type']).toBe('Review');
    });

    it('includes review rating with Rating type', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0].reviewRating).toBeDefined();
      expect(schema.review[0].reviewRating['@type']).toBe('Rating');
      expect(schema.review[0].reviewRating.ratingValue).toBe(5);
      expect(schema.review[0].reviewRating.bestRating).toBe(5);
      expect(schema.review[0].reviewRating.worstRating).toBe(1);
    });

    it('includes author as Person type', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0].author).toBeDefined();
      expect(schema.review[0].author['@type']).toBe('Person');
      expect(schema.review[0].author.name).toBe('John Doe');
    });

    it('includes review date published', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0].datePublished).toBe('2024-01-15T10:30:00Z');
    });

    it('includes review body when content exists', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0].reviewBody).toBe('Excellent campsite with great facilities');
    });

    it('excludes review body when content is missing', () => {
      const reviewsNoContent = [
        {
          ...mockReviews[0],
          content: undefined,
        },
      ];

      const { container } = render(
        <ReviewSchema
          reviews={reviewsNoContent}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0].reviewBody).toBeUndefined();
    });

    it('limits reviews to 10 maximum', () => {
      const manyReviews = Array.from({ length: 15 }, (_, i) => ({
        id: `review-${i}`,
        rating_overall: 5,
        content: `Review ${i}`,
        reviewer_name: `Reviewer ${i}`,
        created_at: '2024-01-15T10:30:00Z',
      }));

      const { container } = render(
        <ReviewSchema
          reviews={manyReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review).toHaveLength(10);
    });

    it('includes review @id with item URL', () => {
      const { container } = render(
        <ReviewSchema
          reviews={mockReviews}
          itemReviewed={mockItemReviewed}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.review[0]['@id']).toBe('/campsites/mountain-view#review-review-001');
    });
  });

  describe('AggregateRatingSchema', () => {
    const mockItemReviewed = {
      '@type': 'LodgingBusiness',
      name: 'Mountain View Camping',
      url: '/campsites/mountain-view',
    };

    it('renders valid JSON-LD script with @context and dynamic @type', () => {
      const { container } = render(
        <AggregateRatingSchema
          itemReviewed={mockItemReviewed}
          ratingValue={4.5}
          reviewCount={123}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).toBeInTheDocument();

      const schema = JSON.parse(script?.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('LodgingBusiness');
    });

    it('includes aggregate rating with correct values', () => {
      const { container } = render(
        <AggregateRatingSchema
          itemReviewed={mockItemReviewed}
          ratingValue={4.5}
          reviewCount={123}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe('4.5');
      expect(schema.aggregateRating.reviewCount).toBe(123);
      expect(schema.aggregateRating.bestRating).toBe(5);
      expect(schema.aggregateRating.worstRating).toBe(1);
    });

    it('formats rating value to one decimal place', () => {
      const { container } = render(
        <AggregateRatingSchema
          itemReviewed={mockItemReviewed}
          ratingValue={4.567}
          reviewCount={100}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.aggregateRating.ratingValue).toBe('4.6');
    });

    it('converts relative URL to canonical URL', () => {
      const { container } = render(
        <AggregateRatingSchema
          itemReviewed={mockItemReviewed}
          ratingValue={4.5}
          reviewCount={123}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.url).toBe('https://campingthailand.com/campsites/mountain-view');
    });

    it('preserves absolute URLs', () => {
      const itemWithAbsoluteUrl = {
        ...mockItemReviewed,
        url: 'https://example.com/campsite',
      };

      const { container } = render(
        <AggregateRatingSchema
          itemReviewed={itemWithAbsoluteUrl}
          ratingValue={4.5}
          reviewCount={123}
        />
      );
      const script = container.querySelector('script[type="application/ld+json"]');
      const schema = JSON.parse(script?.textContent || '{}');

      expect(schema.url).toBe('https://example.com/campsite');
    });
  });
});
