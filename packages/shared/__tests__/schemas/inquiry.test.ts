import { describe, it, expect } from '@jest/globals';
import {
  createInquirySchema,
  inquiryTypeSchema,
  inquiryStatusSchema,
  thaiPhoneSchema,
  dateStringSchema,
  inquiryReplySchema,
  inquiryStatusUpdateSchema,
  inquiryListQuerySchema,
} from '../../src/schemas/inquiry';

describe('Inquiry Schema Validation', () => {
  describe('inquiryTypeSchema', () => {
    it('should accept valid inquiry types', () => {
      const validTypes = ['booking', 'general', 'complaint', 'other'];
      validTypes.forEach((type) => {
        expect(() => inquiryTypeSchema.parse(type)).not.toThrow();
      });
    });

    it('should reject invalid inquiry type', () => {
      expect(() => inquiryTypeSchema.parse('invalid')).toThrow();
      expect(() => inquiryTypeSchema.parse('availability')).toThrow();
      expect(() => inquiryTypeSchema.parse('pricing')).toThrow();
      expect(() => inquiryTypeSchema.parse('')).toThrow();
    });
  });

  describe('inquiryStatusSchema', () => {
    it('should accept valid inquiry statuses', () => {
      const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
      validStatuses.forEach((status) => {
        expect(() => inquiryStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('should reject invalid inquiry status', () => {
      expect(() => inquiryStatusSchema.parse('invalid')).toThrow();
      expect(() => inquiryStatusSchema.parse('pending')).toThrow();
      expect(() => inquiryStatusSchema.parse('read')).toThrow();
      expect(() => inquiryStatusSchema.parse('replied')).toThrow();
      expect(() => inquiryStatusSchema.parse('')).toThrow();
    });
  });

  describe('thaiPhoneSchema', () => {
    it('should accept valid Thai phone numbers', () => {
      const validPhones = [
        '0812345678',
        '0891234567',
        '0623456789',
      ];
      validPhones.forEach((phone) => {
        expect(() => thaiPhoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should accept Thai phone numbers with formatting', () => {
      const result1 = thaiPhoneSchema.parse('081-234-5678');
      expect(result1).toBe('0812345678');

      const result2 = thaiPhoneSchema.parse('081 234 5678');
      expect(result2).toBe('0812345678');

      const result3 = thaiPhoneSchema.parse('081-234 5678');
      expect(result3).toBe('0812345678');
    });

    it('should accept null and undefined', () => {
      expect(() => thaiPhoneSchema.parse(null)).not.toThrow();
      expect(() => thaiPhoneSchema.parse(undefined)).not.toThrow();
    });

    it('should reject invalid Thai phone numbers', () => {
      const invalidPhones = [
        '1234567890',  // doesn't start with 0
        '081234567',   // too short
        '08123456789', // too long
        'abcdefghij',  // non-numeric
      ];
      invalidPhones.forEach((phone) => {
        const result = thaiPhoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('dateStringSchema', () => {
    it('should accept valid date strings in YYYY-MM-DD format', () => {
      const validDates = [
        '2026-01-18',
        '2026-12-31',
        '2025-06-15',
      ];
      validDates.forEach((date) => {
        expect(() => dateStringSchema.parse(date)).not.toThrow();
      });
    });

    it('should accept null and undefined', () => {
      expect(() => dateStringSchema.parse(null)).not.toThrow();
      expect(() => dateStringSchema.parse(undefined)).not.toThrow();
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '01-18-2026',     // MM-DD-YYYY
        '18/01/2026',     // DD/MM/YYYY
        '2026/01/18',     // YYYY/MM/DD
        '2026-1-18',      // single digit month
        '2026-01-8',      // single digit day
        'invalid-date',
        '',
      ];
      invalidDates.forEach((date) => {
        expect(() => dateStringSchema.parse(date)).toThrow();
      });
    });
  });

  describe('createInquirySchema', () => {
    const validInquiryData = {
      campsite_id: '123e4567-e89b-12d3-a456-426614174000',
      guest_name: 'John Doe',
      guest_email: 'john.doe@example.com',
      guest_phone: '0812345678',
      inquiry_type: 'general' as const,
      subject: 'Inquiry about availability',
      message: 'I would like to know if you have availability for 2 people next weekend.',
      check_in_date: '2026-02-01',
      check_out_date: '2026-02-03',
      guest_count: 2,
      accommodation_type_id: '223e4567-e89b-12d3-a456-426614174000',
    };

    it('should accept valid inquiry data with all fields', () => {
      expect(() => createInquirySchema.parse(validInquiryData)).not.toThrow();
      const result = createInquirySchema.parse(validInquiryData);
      expect(result.guest_name).toBe('John Doe');
      expect(result.guest_email).toBe('john.doe@example.com');
    });

    it('should accept valid inquiry data with only required fields', () => {
      const minimalData = {
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
        guest_name: 'Jane Smith',
        guest_email: 'jane@example.com',
        inquiry_type: 'booking' as const,
        message: 'This is a valid message that is at least 20 characters long.',
      };
      expect(() => createInquirySchema.parse(minimalData)).not.toThrow();
    });

    it('should reject missing required field: campsite_id', () => {
      const { campsite_id, ...dataWithoutCampsiteId } = validInquiryData;
      expect(() => createInquirySchema.parse(dataWithoutCampsiteId)).toThrow();
    });

    it('should reject missing required field: guest_name', () => {
      const { guest_name, ...dataWithoutName } = validInquiryData;
      expect(() => createInquirySchema.parse(dataWithoutName)).toThrow();
    });

    it('should reject missing required field: guest_email', () => {
      const { guest_email, ...dataWithoutEmail } = validInquiryData;
      expect(() => createInquirySchema.parse(dataWithoutEmail)).toThrow();
    });

    it('should reject missing required field: message', () => {
      const { message, ...dataWithoutMessage } = validInquiryData;
      expect(() => createInquirySchema.parse(dataWithoutMessage)).toThrow();
    });

    it('should reject invalid campsite_id format', () => {
      const invalidData = {
        ...validInquiryData,
        campsite_id: 'not-a-uuid',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'not-an-email',
        'missing@domain',
        '@example.com',
        'user@',
        '',
      ];
      invalidEmails.forEach((email) => {
        const invalidData = {
          ...validInquiryData,
          guest_email: email,
        };
        expect(() => createInquirySchema.parse(invalidData)).toThrow();
      });
    });

    it('should reject guest_name under 2 characters', () => {
      const invalidData = {
        ...validInquiryData,
        guest_name: 'A',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject guest_name over 100 characters', () => {
      const invalidData = {
        ...validInquiryData,
        guest_name: 'A'.repeat(101),
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject message under 20 characters', () => {
      const invalidData = {
        ...validInquiryData,
        message: 'Too short',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject message over 2000 characters', () => {
      const invalidData = {
        ...validInquiryData,
        message: 'A'.repeat(2001),
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should accept message exactly 20 characters', () => {
      const validData = {
        ...validInquiryData,
        message: 'A'.repeat(20),
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept message exactly 2000 characters', () => {
      const validData = {
        ...validInquiryData,
        message: 'A'.repeat(2000),
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: guest_phone', () => {
      const validData = {
        ...validInquiryData,
        guest_phone: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept valid guest_phone', () => {
      const validData = {
        ...validInquiryData,
        guest_phone: '0891234567',
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: check_in_date', () => {
      const validData = {
        ...validInquiryData,
        check_in_date: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: check_out_date', () => {
      const validData = {
        ...validInquiryData,
        check_out_date: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: subject', () => {
      const validData = {
        ...validInquiryData,
        subject: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: guest_count', () => {
      const validData = {
        ...validInquiryData,
        guest_count: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept null for optional field: accommodation_type_id', () => {
      const validData = {
        ...validInquiryData,
        accommodation_type_id: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should reject check_out_date before check_in_date', () => {
      const invalidData = {
        ...validInquiryData,
        check_in_date: '2026-02-05',
        check_out_date: '2026-02-03',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject check_out_date same as check_in_date', () => {
      const invalidData = {
        ...validInquiryData,
        check_in_date: '2026-02-03',
        check_out_date: '2026-02-03',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should accept valid check_in_date and check_out_date', () => {
      const validData = {
        ...validInquiryData,
        check_in_date: '2026-02-01',
        check_out_date: '2026-02-05',
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept only check_in_date without check_out_date', () => {
      const validData = {
        ...validInquiryData,
        check_in_date: '2026-02-01',
        check_out_date: null,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept only check_out_date without check_in_date', () => {
      const validData = {
        ...validInquiryData,
        check_in_date: null,
        check_out_date: '2026-02-05',
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should coerce guest_count to number', () => {
      const validData = {
        ...validInquiryData,
        guest_count: '3' as any,
      };
      const result = createInquirySchema.parse(validData);
      expect(result.guest_count).toBe(3);
      expect(typeof result.guest_count).toBe('number');
    });

    it('should reject guest_count less than 1', () => {
      const invalidData = {
        ...validInquiryData,
        guest_count: 0,
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject guest_count over 100', () => {
      const invalidData = {
        ...validInquiryData,
        guest_count: 101,
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should accept guest_count exactly 1', () => {
      const validData = {
        ...validInquiryData,
        guest_count: 1,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should accept guest_count exactly 100', () => {
      const validData = {
        ...validInquiryData,
        guest_count: 100,
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid accommodation_type_id format', () => {
      const invalidData = {
        ...validInquiryData,
        accommodation_type_id: 'not-a-uuid',
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should reject subject over 200 characters', () => {
      const invalidData = {
        ...validInquiryData,
        subject: 'A'.repeat(201),
      };
      expect(() => createInquirySchema.parse(invalidData)).toThrow();
    });

    it('should accept subject exactly 200 characters', () => {
      const validData = {
        ...validInquiryData,
        subject: 'A'.repeat(200),
      };
      expect(() => createInquirySchema.parse(validData)).not.toThrow();
    });

    it('should default inquiry_type to general', () => {
      const { inquiry_type, ...dataWithoutType } = validInquiryData;
      const result = createInquirySchema.parse(dataWithoutType);
      expect(result.inquiry_type).toBe('general');
    });

    it('should accept all valid inquiry_type values', () => {
      const types = ['booking', 'general', 'complaint', 'other'] as const;
      types.forEach((type) => {
        const validData = {
          ...validInquiryData,
          inquiry_type: type,
        };
        expect(() => createInquirySchema.parse(validData)).not.toThrow();
        const result = createInquirySchema.parse(validData);
        expect(result.inquiry_type).toBe(type);
      });
    });
  });

  describe('inquiryReplySchema', () => {
    it('should accept valid reply', () => {
      const validReply = {
        reply: 'Thank you for your inquiry. We have availability.',
      };
      expect(() => inquiryReplySchema.parse(validReply)).not.toThrow();
    });

    it('should reject reply under 10 characters', () => {
      const invalidReply = {
        reply: 'Too short',
      };
      expect(() => inquiryReplySchema.parse(invalidReply)).toThrow();
    });

    it('should reject reply over 2000 characters', () => {
      const invalidReply = {
        reply: 'A'.repeat(2001),
      };
      expect(() => inquiryReplySchema.parse(invalidReply)).toThrow();
    });

    it('should accept reply exactly 10 characters', () => {
      const validReply = {
        reply: 'A'.repeat(10),
      };
      expect(() => inquiryReplySchema.parse(validReply)).not.toThrow();
    });

    it('should accept reply exactly 2000 characters', () => {
      const validReply = {
        reply: 'A'.repeat(2000),
      };
      expect(() => inquiryReplySchema.parse(validReply)).not.toThrow();
    });

    it('should reject missing reply field', () => {
      const invalidReply = {};
      expect(() => inquiryReplySchema.parse(invalidReply)).toThrow();
    });
  });

  describe('inquiryStatusUpdateSchema', () => {
    it('should accept valid status update', () => {
      const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
      validStatuses.forEach((status) => {
        const validUpdate = { status };
        expect(() => inquiryStatusUpdateSchema.parse(validUpdate)).not.toThrow();
      });
    });

    it('should reject invalid status', () => {
      const invalidUpdate = { status: 'invalid' };
      expect(() => inquiryStatusUpdateSchema.parse(invalidUpdate)).toThrow();
    });

    it('should reject missing status field', () => {
      const invalidUpdate = {};
      expect(() => inquiryStatusUpdateSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('inquiryListQuerySchema', () => {
    it('should accept valid query with all fields', () => {
      const validQuery = {
        status: 'new' as const,
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
        page: 2,
        limit: 30,
        sort: 'created_at' as const,
        order: 'asc' as const,
      };
      expect(() => inquiryListQuerySchema.parse(validQuery)).not.toThrow();
    });

    it('should use defaults for missing optional fields', () => {
      const result = inquiryListQuerySchema.parse({});
      expect(result.status).toBe('all');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sort).toBe('created_at');
      expect(result.order).toBe('desc');
    });

    it('should coerce page to number', () => {
      const query = { page: '5' };
      const result = inquiryListQuerySchema.parse(query);
      expect(result.page).toBe(5);
      expect(typeof result.page).toBe('number');
    });

    it('should coerce limit to number', () => {
      const query = { limit: '15' };
      const result = inquiryListQuerySchema.parse(query);
      expect(result.limit).toBe(15);
      expect(typeof result.limit).toBe('number');
    });

    it('should reject page less than 1', () => {
      const invalidQuery = { page: 0 };
      expect(() => inquiryListQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should reject limit less than 1', () => {
      const invalidQuery = { limit: 0 };
      expect(() => inquiryListQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should reject limit over 50', () => {
      const invalidQuery = { limit: 51 };
      expect(() => inquiryListQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should accept all valid status values', () => {
      const statuses = ['all', 'new', 'in_progress', 'resolved', 'closed'] as const;
      statuses.forEach((status) => {
        const query = { status };
        expect(() => inquiryListQuerySchema.parse(query)).not.toThrow();
      });
    });

    it('should accept all valid sort values', () => {
      const sortFields = ['created_at', 'status', 'inquiry_type'] as const;
      sortFields.forEach((sort) => {
        const query = { sort };
        expect(() => inquiryListQuerySchema.parse(query)).not.toThrow();
      });
    });

    it('should accept all valid order values', () => {
      const orders = ['asc', 'desc'] as const;
      orders.forEach((order) => {
        const query = { order };
        expect(() => inquiryListQuerySchema.parse(query)).not.toThrow();
      });
    });

    it('should reject invalid campsite_id format', () => {
      const invalidQuery = { campsite_id: 'not-a-uuid' };
      expect(() => inquiryListQuerySchema.parse(invalidQuery)).toThrow();
    });

    it('should accept valid campsite_id', () => {
      const validQuery = {
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => inquiryListQuerySchema.parse(validQuery)).not.toThrow();
    });
  });
});
