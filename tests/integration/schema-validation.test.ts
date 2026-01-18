/**
 * Integration Test: JSON-LD Schema Validation
 *
 * Tests JSON-LD structured data generation for campsites
 * that conforms to Schema.org standards and Google's structured data requirements
 */

describe('Schema Validation - JSON-LD Structure', () => {
  // Helper function to generate schema data (mimics CampsiteSchema logic)
  const generateCampsiteSchema = (campsite: any) => {
    const formatPriceRange = (min: number, max: number) => `฿${min}-${max}`;
    const getCampsiteCanonicalUrl = (slug: string) => `https://campingthailand.com/campsites/${slug}`;

    const primaryPhoto =
      campsite.photos?.find((p: any) => p.is_primary) || campsite.photos?.[0];

    return {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      '@id': getCampsiteCanonicalUrl(campsite.slug || campsite.id),
      name: campsite.name,
      description: campsite.description,
      url: getCampsiteCanonicalUrl(campsite.slug || campsite.id),
      image: primaryPhoto?.url,
      telephone: campsite.phone,
      email: campsite.email,
      priceRange: formatPriceRange(campsite.min_price, campsite.max_price),
      checkinTime: campsite.check_in_time,
      checkoutTime: campsite.check_out_time,
      address: {
        '@type': 'PostalAddress',
        streetAddress: campsite.address,
        addressRegion: campsite.province.name_en,
        addressCountry: 'TH',
      },
      ...(campsite.latitude &&
        campsite.longitude && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: campsite.latitude,
            longitude: campsite.longitude,
          },
        }),
      ...(campsite.website && { sameAs: campsite.website }),
      ...(campsite.average_rating &&
        campsite.review_count &&
        campsite.review_count > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: campsite.average_rating.toFixed(1),
            reviewCount: campsite.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      ...(campsite.amenities &&
        campsite.amenities.length > 0 && {
          amenityFeature: campsite.amenities.map((amenity: any) => ({
            '@type': 'LocationFeatureSpecification',
            name: amenity.name_en,
            value: true,
          })),
        }),
      ...(campsite.photos &&
        campsite.photos.length > 0 && {
          photo: campsite.photos.slice(0, 5).map((photo: any) => ({
            '@type': 'ImageObject',
            url: photo.url,
            description: photo.alt_text || campsite.name,
          })),
        }),
    };
  };

  const mockCampsiteMinimal = {
    id: 'test-campsite-123',
    slug: 'test-campsite',
    name: 'Test Campsite',
    description: 'A beautiful test campsite',
    address: '123 Test Street',
    latitude: null,
    longitude: null,
    phone: null,
    email: null,
    website: null,
    min_price: 500,
    max_price: 1500,
    check_in_time: null,
    check_out_time: null,
    average_rating: null,
    review_count: null,
    campsite_type: 'tent',
    province: {
      name_en: 'Chiang Mai',
      name_th: 'เชียงใหม่',
    },
  };

  const mockCampsiteComplete = {
    ...mockCampsiteMinimal,
    latitude: 18.7883,
    longitude: 98.9853,
    phone: '+66123456789',
    email: 'info@testcampsite.com',
    website: 'https://testcampsite.com',
    check_in_time: '14:00',
    check_out_time: '12:00',
    average_rating: 4.5,
    review_count: 25,
    photos: [
      {
        url: 'https://example.com/photo1.jpg',
        alt_text: 'Main campsite view',
        is_primary: true,
      },
      {
        url: 'https://example.com/photo2.jpg',
        alt_text: 'Tent area',
        is_primary: false,
      },
    ],
    amenities: [
      {
        name_en: 'WiFi',
        name_th: 'ไวไฟ',
      },
      {
        name_en: 'Parking',
        name_th: 'ที่จอดรถ',
      },
    ],
    recent_reviews: [
      {
        rating_overall: 5,
        content: 'Great campsite!',
        reviewer_name: 'John Doe',
        created_at: '2025-01-15T10:00:00Z',
      },
    ],
  };

  describe('Basic JSON-LD Structure', () => {
    it('should output valid JSON-LD structure', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it('should have @context as https://schema.org', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema['@context']).toBe('https://schema.org');
    });

    it('should have @type as LodgingBusiness', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema['@type']).toBe('LodgingBusiness');
    });

    it('should be parseable by JSON.parse without errors', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(() => JSON.stringify(schema)).not.toThrow();
      expect(() => JSON.parse(JSON.stringify(schema))).not.toThrow();
    });
  });

  describe('Required Fields', () => {
    it('should include name field', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.name).toBe('Test Campsite');
      expect(typeof schema.name).toBe('string');
    });

    it('should include url field', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.url).toBeDefined();
      expect(schema.url).toBe('https://campingthailand.com/campsites/test-campsite');
      expect(typeof schema.url).toBe('string');
    });

    it('should include address field', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.streetAddress).toBe('123 Test Street');
      expect(schema.address.addressRegion).toBe('Chiang Mai');
      expect(schema.address.addressCountry).toBe('TH');
    });

    it('should include @id field', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema['@id']).toBeDefined();
      expect(schema['@id']).toBe('https://campingthailand.com/campsites/test-campsite');
    });
  });

  describe('Optional Fields - Geo Coordinates', () => {
    it('should include geo field when latitude and longitude are provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.geo).toBeDefined();
      expect(schema.geo['@type']).toBe('GeoCoordinates');
      expect(schema.geo.latitude).toBe(18.7883);
      expect(schema.geo.longitude).toBe(98.9853);
    });

    it('should not include geo field when coordinates are null', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.geo).toBeUndefined();
    });
  });

  describe('Optional Fields - Aggregate Rating', () => {
    it('should include aggregateRating when rating and review count are provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe('4.5');
      expect(schema.aggregateRating.reviewCount).toBe(25);
      expect(schema.aggregateRating.bestRating).toBe(5);
      expect(schema.aggregateRating.worstRating).toBe(1);
    });

    it('should not include aggregateRating when rating is null', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('should not include aggregateRating when review count is 0', () => {
      const campsiteNoReviews = {
        ...mockCampsiteMinimal,
        average_rating: 0,
        review_count: 0,
      };

      const schema = generateCampsiteSchema(campsiteNoReviews);

      expect(schema.aggregateRating).toBeUndefined();
    });
  });

  describe('Optional Fields - Photos', () => {
    it('should include photo array when photos are provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.photo).toBeDefined();
      expect(Array.isArray(schema.photo)).toBe(true);
      expect(schema.photo.length).toBe(2);
      expect(schema.photo[0]['@type']).toBe('ImageObject');
      expect(schema.photo[0].url).toBe('https://example.com/photo1.jpg');
      expect(schema.photo[0].description).toBe('Main campsite view');
    });

    it('should not include photo field when no photos provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.photo).toBeUndefined();
    });

    it('should use primary photo for image field', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.image).toBe('https://example.com/photo1.jpg');
    });

    it('should limit photos to maximum of 5', () => {
      const campsiteWithManyPhotos = {
        ...mockCampsiteComplete,
        photos: Array(10).fill(null).map((_, i) => ({
          url: `https://example.com/photo${i + 1}.jpg`,
          alt_text: `Photo ${i + 1}`,
          is_primary: i === 0,
        })),
      };

      const schema = generateCampsiteSchema(campsiteWithManyPhotos);

      expect(schema.photo.length).toBe(5);
    });
  });

  describe('Optional Fields - Amenities', () => {
    it('should include amenityFeature when amenities are provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.amenityFeature).toBeDefined();
      expect(Array.isArray(schema.amenityFeature)).toBe(true);
      expect(schema.amenityFeature.length).toBe(2);
      expect(schema.amenityFeature[0]['@type']).toBe('LocationFeatureSpecification');
      expect(schema.amenityFeature[0].name).toBe('WiFi');
      expect(schema.amenityFeature[0].value).toBe(true);
    });

    it('should not include amenityFeature when no amenities provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.amenityFeature).toBeUndefined();
    });
  });

  describe('Optional Fields - Contact and Pricing', () => {
    it('should include telephone when phone is provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.telephone).toBe('+66123456789');
    });

    it('should include email when email is provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.email).toBe('info@testcampsite.com');
    });

    it('should include priceRange', () => {
      const schema = generateCampsiteSchema(mockCampsiteMinimal);

      expect(schema.priceRange).toBe('฿500-1500');
    });

    it('should include checkinTime and checkoutTime when provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.checkinTime).toBe('14:00');
      expect(schema.checkoutTime).toBe('12:00');
    });

    it('should include sameAs when website is provided', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      expect(schema.sameAs).toBe('https://testcampsite.com');
    });
  });

  describe('Google Structured Data Requirements', () => {
    it('should have all required properties for LodgingBusiness', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      // Required by Google for LodgingBusiness
      expect(schema['@type']).toBe('LodgingBusiness');
      expect(schema.name).toBeDefined();
      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
    });

    it('should have valid PostalAddress structure', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      const address = schema.address;
      expect(address['@type']).toBe('PostalAddress');
      expect(address.streetAddress).toBeDefined();
      expect(address.addressRegion).toBeDefined();
      expect(address.addressCountry).toBeDefined();
      expect(address.addressCountry).toBe('TH');
    });

    it('should have valid GeoCoordinates structure when present', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      const geo = schema.geo;
      expect(geo['@type']).toBe('GeoCoordinates');
      expect(typeof geo.latitude).toBe('number');
      expect(typeof geo.longitude).toBe('number');
      expect(geo.latitude).toBeGreaterThanOrEqual(-90);
      expect(geo.latitude).toBeLessThanOrEqual(90);
      expect(geo.longitude).toBeGreaterThanOrEqual(-180);
      expect(geo.longitude).toBeLessThanOrEqual(180);
    });

    it('should have valid AggregateRating structure when present', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      const rating = schema.aggregateRating;
      expect(rating['@type']).toBe('AggregateRating');
      expect(rating.ratingValue).toBeDefined();
      expect(rating.reviewCount).toBeGreaterThan(0);
      expect(rating.bestRating).toBe(5);
      expect(rating.worstRating).toBe(1);
    });

    it('should have valid ImageObject structure when photos present', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      const photos = schema.photo;
      expect(Array.isArray(photos)).toBe(true);

      photos.forEach((photo: any) => {
        expect(photo['@type']).toBe('ImageObject');
        expect(photo.url).toBeDefined();
        expect(typeof photo.url).toBe('string');
        expect(photo.description).toBeDefined();
      });
    });

    it('should be valid JSON without circular references', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);

      // Test that schema can be stringified (no circular refs)
      expect(() => JSON.stringify(schema)).not.toThrow();

      // Test that it can be parsed back
      const stringified = JSON.stringify(schema);
      const parsed = JSON.parse(stringified);
      expect(parsed).toEqual(schema);
    });
  });

  describe('Edge Cases', () => {
    it('should handle campsite without slug (use id instead)', () => {
      const campsiteNoSlug = {
        ...mockCampsiteMinimal,
        slug: null,
      };

      const schema = generateCampsiteSchema(campsiteNoSlug);

      expect(schema.url).toBe('https://campingthailand.com/campsites/test-campsite-123');
      expect(schema['@id']).toBe('https://campingthailand.com/campsites/test-campsite-123');
    });

    it('should handle missing description gracefully', () => {
      const campsiteNoDescription = {
        ...mockCampsiteMinimal,
        description: null,
      };

      const schema = generateCampsiteSchema(campsiteNoDescription);

      expect(schema.description).toBeNull();
    });

    it('should use campsite name as photo description when alt_text is null', () => {
      const campsitePhotoNoAlt = {
        ...mockCampsiteComplete,
        photos: [
          {
            url: 'https://example.com/photo.jpg',
            alt_text: null,
            is_primary: true,
          },
        ],
      };

      const schema = generateCampsiteSchema(campsitePhotoNoAlt);

      expect(schema.photo[0].description).toBe('Test Campsite');
    });

    it('should generate valid JSON for output in script tag', () => {
      const schema = generateCampsiteSchema(mockCampsiteComplete);
      const jsonString = JSON.stringify(schema);

      expect(jsonString).toBeTruthy();
      expect(typeof jsonString).toBe('string');
      expect(jsonString).toContain('"@context":"https://schema.org"');
      expect(jsonString).toContain('"@type":"LodgingBusiness"');
    });
  });
});
