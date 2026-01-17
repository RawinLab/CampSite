import { signupSchema, loginSchema, campsiteSearchSchema } from '../src/schemas';

describe('Auth Schemas', () => {
  describe('signupSchema', () => {
    it('validates correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password1',
        full_name: 'Test User',
      };
      expect(() => signupSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password1',
        full_name: 'Test User',
      };
      expect(() => signupSchema.parse(invalidData)).toThrow();
    });

    it('rejects weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        full_name: 'Test User',
      };
      expect(() => signupSchema.parse(invalidData)).toThrow();
    });

    it('validates Thai phone number', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password1',
        full_name: 'Test User',
        phone: '0812345678',
      };
      expect(() => signupSchema.parse(validData)).not.toThrow();
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'any-password',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });
  });
});

describe('Campsite Schemas', () => {
  describe('campsiteSearchSchema', () => {
    it('provides default values', () => {
      const result = campsiteSearchSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sort_by).toBe('rating');
    });

    it('validates price range', () => {
      const validData = {
        min_price: 0,
        max_price: 5000,
      };
      expect(() => campsiteSearchSchema.parse(validData)).not.toThrow();
    });
  });
});
