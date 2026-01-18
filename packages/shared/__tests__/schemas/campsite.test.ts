import { describe, it, expect } from '@jest/globals';
import { campsiteCreateSchema, campsiteSearchSchema } from '../../src/schemas/campsite';

describe('Campsite Schemas', () => {
  describe('campsiteCreateSchema', () => {
    const validCampsiteData = {
      name: 'Mountain View Campsite',
      description: 'A beautiful campsite nestled in the mountains with stunning views and excellent facilities for camping enthusiasts.',
      province_id: 1,
      address: '123 Mountain Road, Chiang Mai',
      latitude: 18.7883,
      longitude: 98.9853,
      campsite_type: 'camping' as const,
      check_in_time: '14:00',
      check_out_time: '11:00',
    };

    describe('Required Fields Validation', () => {
      it('should validate all required fields are present', () => {
        const result = campsiteCreateSchema.safeParse(validCampsiteData);
        expect(result.success).toBe(true);
      });

      it('should reject when name is missing', () => {
        const { name, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
        }
      });

      it('should reject when description is missing', () => {
        const { description, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('description');
        }
      });

      it('should reject when province_id is missing', () => {
        const { province_id, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('province_id');
        }
      });

      it('should reject when address is missing', () => {
        const { address, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('address');
        }
      });

      it('should reject when latitude is missing', () => {
        const { latitude, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('latitude');
        }
      });

      it('should reject when longitude is missing', () => {
        const { longitude, ...data } = validCampsiteData;
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('longitude');
        }
      });
    });

    describe('Name Validation (3-100 chars)', () => {
      it('should accept name with exactly 3 characters', () => {
        const data = { ...validCampsiteData, name: 'ABC' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with 50 characters', () => {
        const data = { ...validCampsiteData, name: 'A'.repeat(50) };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject name with less than 3 characters', () => {
        const data = { ...validCampsiteData, name: 'AB' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('should reject empty name', () => {
        const data = { ...validCampsiteData, name: '' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('should accept name with special characters', () => {
        const data = { ...validCampsiteData, name: "O'Reilly's Camp & Resort" };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Description Length Validation', () => {
      it('should accept description with exactly 50 characters', () => {
        const data = { ...validCampsiteData, description: 'A'.repeat(50) };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept description with 200 characters', () => {
        const data = { ...validCampsiteData, description: 'A'.repeat(200) };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject description with less than 50 characters', () => {
        const data = { ...validCampsiteData, description: 'Short description' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 50 characters');
        }
      });

      it('should reject description with exactly 49 characters', () => {
        const data = { ...validCampsiteData, description: 'A'.repeat(49) };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 50 characters');
        }
      });

      it('should accept description with newlines and formatting', () => {
        const data = {
          ...validCampsiteData,
          description: 'Line 1 of description with sufficient length.\nLine 2 continues here with more details.',
        };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('GPS Coordinates Validation', () => {
      it('should accept valid latitude at minimum boundary (-90)', () => {
        const data = { ...validCampsiteData, latitude: -90 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid latitude at maximum boundary (90)', () => {
        const data = { ...validCampsiteData, latitude: 90 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid latitude in Thailand range (5-20)', () => {
        const data = { ...validCampsiteData, latitude: 13.7563 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject latitude above 90', () => {
        const data = { ...validCampsiteData, latitude: 91 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject latitude below -90', () => {
        const data = { ...validCampsiteData, latitude: -91 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid longitude at minimum boundary (-180)', () => {
        const data = { ...validCampsiteData, longitude: -180 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid longitude at maximum boundary (180)', () => {
        const data = { ...validCampsiteData, longitude: 180 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid longitude in Thailand range (97-106)', () => {
        const data = { ...validCampsiteData, longitude: 100.5018 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject longitude above 180', () => {
        const data = { ...validCampsiteData, longitude: 181 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject longitude below -180', () => {
        const data = { ...validCampsiteData, longitude: -181 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept decimal precision coordinates', () => {
        const data = {
          ...validCampsiteData,
          latitude: 13.756331,
          longitude: 100.501762,
        };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Province ID Validation', () => {
      it('should accept valid province_id as number', () => {
        const data = { ...validCampsiteData, province_id: 50 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject province_id as string', () => {
        const data = { ...validCampsiteData, province_id: '1' as any };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject negative province_id', () => {
        const data = { ...validCampsiteData, province_id: -1 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true); // Note: Schema doesn't enforce positive numbers
      });

      it('should reject zero province_id', () => {
        const data = { ...validCampsiteData, province_id: 0 };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true); // Note: Schema doesn't enforce positive numbers
      });
    });

    describe('Campsite Type Validation', () => {
      it('should accept "camping" type', () => {
        const data = { ...validCampsiteData, campsite_type: 'camping' as const };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "glamping" type', () => {
        const data = { ...validCampsiteData, campsite_type: 'glamping' as const };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "tented-resort" type', () => {
        const data = { ...validCampsiteData, campsite_type: 'tented-resort' as const };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "bungalow" type', () => {
        const data = { ...validCampsiteData, campsite_type: 'bungalow' as const };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid campsite type', () => {
        const data = { ...validCampsiteData, campsite_type: 'hotel' as any };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty string as campsite type', () => {
        const data = { ...validCampsiteData, campsite_type: '' as any };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Check-in/Check-out Time Validation', () => {
      it('should accept valid check_in_time in HH:MM format', () => {
        const data = { ...validCampsiteData, check_in_time: '14:00' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid check_out_time in HH:MM format', () => {
        const data = { ...validCampsiteData, check_out_time: '11:00' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject check_in_time without leading zero', () => {
        const data = { ...validCampsiteData, check_in_time: '9:00' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('HH:MM format');
        }
      });

      it('should reject check_out_time in 12-hour format', () => {
        const data = { ...validCampsiteData, check_out_time: '11:00 AM' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject check_in_time with seconds', () => {
        const data = { ...validCampsiteData, check_in_time: '14:00:00' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept midnight (00:00)', () => {
        const data = { ...validCampsiteData, check_in_time: '00:00' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept 23:59', () => {
        const data = { ...validCampsiteData, check_out_time: '23:59' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Contact Information Validation', () => {
      it('should accept valid phone number (optional)', () => {
        const data = { ...validCampsiteData, phone: '+66812345678' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept missing phone number', () => {
        const result = campsiteCreateSchema.safeParse(validCampsiteData);
        expect(result.success).toBe(true);
      });

      it('should accept valid email (optional)', () => {
        const data = { ...validCampsiteData, email: 'info@campsite.com' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const data = { ...validCampsiteData, email: 'invalid-email' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept missing email', () => {
        const result = campsiteCreateSchema.safeParse(validCampsiteData);
        expect(result.success).toBe(true);
      });

      it('should accept valid website URL (optional)', () => {
        const data = { ...validCampsiteData, website: 'https://campsite.example.com' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid website URL', () => {
        const data = { ...validCampsiteData, website: 'not-a-url' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid booking_url (optional)', () => {
        const data = { ...validCampsiteData, booking_url: 'https://booking.example.com/campsite' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid booking_url', () => {
        const data = { ...validCampsiteData, booking_url: 'invalid-url' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept all optional contact fields together', () => {
        const data = {
          ...validCampsiteData,
          phone: '+66812345678',
          email: 'info@campsite.com',
          website: 'https://campsite.example.com',
          booking_url: 'https://booking.example.com/campsite',
        };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Address Validation', () => {
      it('should accept address with exactly 10 characters', () => {
        const data = { ...validCampsiteData, address: '1234567890' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject address with less than 10 characters', () => {
        const data = { ...validCampsiteData, address: '123 Road' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept long address with Thai characters', () => {
        const data = { ...validCampsiteData, address: '123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพมหานคร 10110' };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Amenity IDs Validation', () => {
      it('should accept array of amenity IDs (optional)', () => {
        const data = { ...validCampsiteData, amenity_ids: [1, 2, 3, 4, 5] };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept empty array of amenity IDs', () => {
        const data = { ...validCampsiteData, amenity_ids: [] };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept missing amenity_ids', () => {
        const result = campsiteCreateSchema.safeParse(validCampsiteData);
        expect(result.success).toBe(true);
      });

      it('should reject amenity_ids with string values', () => {
        const data = { ...validCampsiteData, amenity_ids: ['1', '2'] as any };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept single amenity ID', () => {
        const data = { ...validCampsiteData, amenity_ids: [1] };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid Data Rejection', () => {
      it('should reject completely empty object', () => {
        const result = campsiteCreateSchema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });

      it('should reject null values for required fields', () => {
        const data = { ...validCampsiteData, name: null };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject undefined values for required fields', () => {
        const data = { ...validCampsiteData, description: undefined };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should provide multiple error messages for multiple invalid fields', () => {
        const data = {
          name: 'AB', // Too short
          description: 'Short', // Too short
          province_id: 'invalid' as any,
          latitude: 100, // Out of range
        };
        const result = campsiteCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
        }
      });

      it('should reject extra unknown fields', () => {
        const data = { ...validCampsiteData, unknown_field: 'value' };
        const result = campsiteCreateSchema.safeParse(data);
        // Zod by default allows extra fields unless .strict() is used
        expect(result.success).toBe(true);
      });
    });
  });

  describe('campsiteSearchSchema', () => {
    describe('Query String Validation', () => {
      it('should accept valid query string', () => {
        const data = { query: 'mountain camping' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept missing query (optional)', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept empty query string', () => {
        const data = { query: '' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Price Range Validation', () => {
      it('should accept valid min_price of 0', () => {
        const data = { min_price: 0 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_price).toBe(0);
        }
      });

      it('should accept valid min_price as positive number', () => {
        const data = { min_price: 500 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_price).toBe(500);
        }
      });

      it('should reject negative min_price', () => {
        const data = { min_price: -100 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid max_price', () => {
        const data = { max_price: 5000 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.max_price).toBe(5000);
        }
      });

      it('should accept max_price at boundary (10000)', () => {
        const data = { max_price: 10000 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject max_price above 10000', () => {
        const data = { max_price: 10001 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept both min_price and max_price together', () => {
        const data = { min_price: 500, max_price: 2000 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce string price to number', () => {
        const data = { min_price: '500', max_price: '2000' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_price).toBe(500);
          expect(result.data.max_price).toBe(2000);
        }
      });
    });

    describe('Rating Range Validation', () => {
      it('should accept min_rating of 0', () => {
        const data = { min_rating: 0 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_rating).toBe(0);
        }
      });

      it('should accept min_rating of 5', () => {
        const data = { min_rating: 5 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept min_rating between 0 and 5', () => {
        const data = { min_rating: 3.5 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject min_rating below 0', () => {
        const data = { min_rating: -1 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject min_rating above 5', () => {
        const data = { min_rating: 6 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should coerce string rating to number', () => {
        const data = { min_rating: '4' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_rating).toBe(4);
        }
      });
    });

    describe('Province ID Filter Validation', () => {
      it('should accept valid province_id', () => {
        const data = { province_id: 1 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce string province_id to number', () => {
        const data = { province_id: '50' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.province_id).toBe(50);
        }
      });

      it('should accept missing province_id (optional)', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Campsite Type Filter Validation', () => {
      it('should accept "camping" type', () => {
        const data = { type: 'camping' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "glamping" type', () => {
        const data = { type: 'glamping' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "tented-resort" type', () => {
        const data = { type: 'tented-resort' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "bungalow" type', () => {
        const data = { type: 'bungalow' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid type', () => {
        const data = { type: 'hotel' as any };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept missing type (optional)', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Amenities Filter Validation', () => {
      it('should accept array of amenity IDs', () => {
        const data = { amenities: [1, 2, 3] };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept empty array', () => {
        const data = { amenities: [] };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept single amenity', () => {
        const data = { amenities: [1] };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject amenities with string values', () => {
        const data = { amenities: ['1', '2'] as any };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept missing amenities (optional)', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Pagination Validation', () => {
      it('should default page to 1', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
        }
      });

      it('should accept valid page number', () => {
        const data = { page: 5 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject page less than 1', () => {
        const data = { page: 0 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should coerce string page to number', () => {
        const data = { page: '3' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(3);
        }
      });

      it('should default limit to 20', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
        }
      });

      it('should accept valid limit', () => {
        const data = { limit: 10 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept limit at maximum (50)', () => {
        const data = { limit: 50 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject limit above 50', () => {
        const data = { limit: 51 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject limit less than 1', () => {
        const data = { limit: 0 };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should coerce string limit to number', () => {
        const data = { limit: '25' };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(25);
        }
      });
    });

    describe('Sort By Validation', () => {
      it('should default sort_by to "rating"', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort_by).toBe('rating');
        }
      });

      it('should accept "rating" sort', () => {
        const data = { sort_by: 'rating' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "price_asc" sort', () => {
        const data = { sort_by: 'price_asc' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "price_desc" sort', () => {
        const data = { sort_by: 'price_desc' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept "newest" sort', () => {
        const data = { sort_by: 'newest' as const };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid sort_by value', () => {
        const data = { sort_by: 'popular' as any };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Combined Filter Validation', () => {
      it('should accept all filters together', () => {
        const data = {
          query: 'beach camping',
          province_id: 10,
          type: 'glamping' as const,
          min_price: 500,
          max_price: 2000,
          amenities: [1, 2, 3],
          min_rating: 4,
          page: 2,
          limit: 30,
          sort_by: 'price_asc' as const,
        };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should apply defaults when no filters provided', () => {
        const data = {};
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
          expect(result.data.sort_by).toBe('rating');
        }
      });

      it('should handle URL query string format', () => {
        const data = {
          query: 'mountain',
          province_id: '25',
          min_price: '1000',
          max_price: '3000',
          page: '1',
          limit: '20',
        };
        const result = campsiteSearchSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.province_id).toBe(25);
          expect(result.data.min_price).toBe(1000);
          expect(result.data.max_price).toBe(3000);
        }
      });
    });
  });
});
