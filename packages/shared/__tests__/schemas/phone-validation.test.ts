import { thaiPhoneSchema } from '../../src/schemas/inquiry';
import { z } from 'zod';

describe('Thai Phone Number Validation', () => {
  describe('Valid Thai phone formats', () => {
    it('should accept 10 digits starting with 0 (08x)', () => {
      const result = thaiPhoneSchema.safeParse('0812345678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0812345678');
      }
    });

    it('should accept 10 digits starting with 0 (09x)', () => {
      const result = thaiPhoneSchema.safeParse('0912345678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0912345678');
      }
    });

    it('should accept 10 digits starting with 0 (06x)', () => {
      const result = thaiPhoneSchema.safeParse('0612345678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0612345678');
      }
    });

    it('should accept phone with spaces and remove them', () => {
      const result = thaiPhoneSchema.safeParse('081 234 5678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0812345678');
      }
    });

    it('should accept phone with dashes and remove them', () => {
      const result = thaiPhoneSchema.safeParse('081-234-5678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0812345678');
      }
    });

    it('should accept phone with mixed spaces and dashes', () => {
      const result = thaiPhoneSchema.safeParse('081-234 5678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0812345678');
      }
    });

    it('should accept all valid Thai mobile prefixes (06x, 08x, 09x)', () => {
      const validPrefixes = ['06', '08', '09'];
      validPrefixes.forEach(prefix => {
        const phoneNumber = `${prefix}12345678`;
        const result = thaiPhoneSchema.safeParse(phoneNumber);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(phoneNumber);
        }
      });
    });
  });

  describe('Invalid formats that should fail', () => {
    it('should reject phone with country code (+66)', () => {
      const result = thaiPhoneSchema.safeParse('+66812345678');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone missing leading 0', () => {
      const result = thaiPhoneSchema.safeParse('812345678');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone with 9 digits', () => {
      const result = thaiPhoneSchema.safeParse('081234567');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone with 11 digits', () => {
      const result = thaiPhoneSchema.safeParse('08123456789');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone not starting with 0', () => {
      const result = thaiPhoneSchema.safeParse('1234567890');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone containing letters', () => {
      const result = thaiPhoneSchema.safeParse('abc1234567');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone with special characters other than space/dash', () => {
      const result = thaiPhoneSchema.safeParse('081.234.5678');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should reject phone with parentheses', () => {
      const result = thaiPhoneSchema.safeParse('(081) 234-5678');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Thai phone number format');
      }
    });

    it('should accept landline numbers (07x) - schema allows 0 + 9 digits', () => {
      // Note: Current regex /^0\d{9}$/ accepts any 0 + 9 digits including landlines
      const result = thaiPhoneSchema.safeParse('0712345678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0712345678');
      }
    });
  });

  describe('Optional phone field', () => {
    it('should accept empty string', () => {
      const result = thaiPhoneSchema.safeParse('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('should accept null', () => {
      const result = thaiPhoneSchema.safeParse(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should accept undefined', () => {
      const result = thaiPhoneSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only string as valid empty string', () => {
      // After transformation, spaces are removed, resulting in empty string which is allowed
      const result = thaiPhoneSchema.safeParse('   ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('should handle dash-only string as valid empty string', () => {
      // After transformation, dashes are removed, resulting in empty string which is allowed
      const result = thaiPhoneSchema.safeParse('---');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('should trim and validate complex formatted number', () => {
      const result = thaiPhoneSchema.safeParse('  081-234-5678  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0812345678');
      }
    });

    it('should accept all 10 digit combinations starting with valid prefixes', () => {
      const validNumbers = [
        '0600000000',
        '0699999999',
        '0800000000',
        '0899999999',
        '0900000000',
        '0999999999',
      ];

      validNumbers.forEach(number => {
        const result = thaiPhoneSchema.safeParse(number);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(number);
        }
      });
    });
  });
});
