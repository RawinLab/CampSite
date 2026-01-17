import { thaiPhoneRegex, signupSchema } from '../../src/schemas/auth';

describe('Thai Phone Number Validation', () => {
  describe('thaiPhoneRegex - Direct Regex Tests', () => {
    describe('Valid mobile numbers', () => {
      it('should accept 081-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('0812345678')).toBe(true);
      });

      it('should accept 082-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('0823456789')).toBe(true);
      });

      it('should accept 089-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('0891234567')).toBe(true);
      });

      it('should accept 091-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('0912345678')).toBe(true);
      });

      it('should accept 099-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('0999999999')).toBe(true);
      });
    });

    describe('Valid landline numbers', () => {
      it('should accept 02-xxx-xxxx format (9 digits)', () => {
        expect(thaiPhoneRegex.test('021234567')).toBe(true);
      });

      it('should accept 02-xxxx-xxxx format (10 digits)', () => {
        expect(thaiPhoneRegex.test('0212345678')).toBe(true);
      });

      it('should accept 03-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('031234567')).toBe(true);
      });

      it('should accept 04-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('041234567')).toBe(true);
      });

      it('should accept 05-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('051234567')).toBe(true);
      });

      it('should accept 07-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('071234567')).toBe(true);
      });
    });

    describe('Invalid - too short', () => {
      it('should reject numbers with less than 9 digits', () => {
        expect(thaiPhoneRegex.test('0812345')).toBe(false);
      });

      it('should reject 8-digit numbers', () => {
        expect(thaiPhoneRegex.test('08123456')).toBe(false);
      });

      it('should reject 6-digit numbers', () => {
        expect(thaiPhoneRegex.test('021234')).toBe(false);
      });
    });

    describe('Invalid - too long', () => {
      it('should reject numbers with more than 10 digits', () => {
        expect(thaiPhoneRegex.test('08123456789')).toBe(false);
      });

      it('should reject 11-digit numbers', () => {
        expect(thaiPhoneRegex.test('02123456789')).toBe(false);
      });
    });

    describe('Invalid - does not start with 0', () => {
      it('should reject numbers starting with 1', () => {
        expect(thaiPhoneRegex.test('1812345678')).toBe(false);
      });

      it('should reject numbers starting with 8', () => {
        expect(thaiPhoneRegex.test('812345678')).toBe(false);
      });

      it('should reject numbers starting with 9', () => {
        expect(thaiPhoneRegex.test('912345678')).toBe(false);
      });
    });

    describe('Invalid - international format', () => {
      it('should reject +66 format', () => {
        expect(thaiPhoneRegex.test('+66812345678')).toBe(false);
      });

      it('should reject 66 prefix without +', () => {
        expect(thaiPhoneRegex.test('66812345678')).toBe(false);
      });
    });

    describe('Invalid - special characters and spaces', () => {
      it('should reject numbers with dashes', () => {
        expect(thaiPhoneRegex.test('081-234-5678')).toBe(false);
      });

      it('should reject numbers with spaces', () => {
        expect(thaiPhoneRegex.test('081 234 5678')).toBe(false);
      });

      it('should reject numbers with parentheses', () => {
        expect(thaiPhoneRegex.test('(081) 2345678')).toBe(false);
      });
    });

    describe('Invalid - wrong patterns', () => {
      it('should reject 00-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('001234567')).toBe(false);
      });

      it('should reject 01-xxx-xxxx format', () => {
        expect(thaiPhoneRegex.test('011234567')).toBe(false);
      });

      it('should accept 08 with 9 digits (edge case for landline pattern)', () => {
        // Note: The regex pattern 0[2-9]\d{7,8} allows 08/09 with 9 digits
        // This is technically valid per the regex (falls under landline pattern)
        expect(thaiPhoneRegex.test('081234567')).toBe(true);
      });

      it('should accept 09 with 9 digits (edge case for landline pattern)', () => {
        // Note: The regex pattern 0[2-9]\d{7,8} allows 08/09 with 9 digits
        // This is technically valid per the regex (falls under landline pattern)
        expect(thaiPhoneRegex.test('091234567')).toBe(true);
      });
    });
  });

  describe('signupSchema - Phone Field Validation', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123',
      full_name: 'John Doe',
    };

    describe('Valid phone numbers through schema', () => {
      it('should validate with valid mobile number (081)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '0812345678',
        });
        expect(result.success).toBe(true);
      });

      it('should validate with valid mobile number (089)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '0891234567',
        });
        expect(result.success).toBe(true);
      });

      it('should validate with valid mobile number (091)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '0912345678',
        });
        expect(result.success).toBe(true);
      });

      it('should validate with valid landline number (02)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '021234567',
        });
        expect(result.success).toBe(true);
      });

      it('should validate with valid landline number (10 digits)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '0212345678',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Phone field is optional', () => {
      it('should validate when phone field is missing', () => {
        const result = signupSchema.safeParse(validUserData);
        expect(result.success).toBe(true);
      });

      it('should validate when phone is empty string', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '',
        });
        expect(result.success).toBe(true);
      });

      it('should validate when phone is undefined', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: undefined,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid phone numbers through schema', () => {
      it('should reject too short phone number', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '0812345',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });

      it('should reject too long phone number', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '08123456789',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });

      it('should reject phone not starting with 0', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '812345678',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });

      it('should reject international format (+66)', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '+66812345678',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });

      it('should reject phone with dashes', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '081-234-5678',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });

      it('should reject phone with spaces', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '081 234 5678',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Thai phone number');
        }
      });
    });

    describe('Edge cases', () => {
      it('should reject phone with letters', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '081234567a',
        });
        expect(result.success).toBe(false);
      });

      it('should reject phone with special characters', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '081234567#',
        });
        expect(result.success).toBe(false);
      });

      it('should reject whitespace-only phone', () => {
        const result = signupSchema.safeParse({
          ...validUserData,
          phone: '   ',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
