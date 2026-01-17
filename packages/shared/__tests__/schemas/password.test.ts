import { signupSchema, resetPasswordSchema } from '../../src/schemas/auth';
import { ZodError } from 'zod';

describe('Password Strength Validation', () => {
  describe('signupSchema password validation', () => {
    describe('valid passwords', () => {
      it('should accept password with minimum requirements (8 chars, uppercase, number)', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password1',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept exactly 8 characters with uppercase and number', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Passw0rd',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept password with multiple uppercase letters', () => {
        const validData = {
          email: 'test@example.com',
          password: 'PASSWORD123',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept password with multiple numbers', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123456',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept password with special characters', () => {
        const validData = {
          email: 'test@example.com',
          password: 'P@ssw0rd!',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept very long password', () => {
        const validData = {
          email: 'test@example.com',
          password: 'VeryLongPassword123WithManyCharacters',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid passwords - too short', () => {
      it('should reject password with only 7 characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Pass1',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
        }
      });

      it('should reject empty password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
        }
      });

      it('should reject password with 3 characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Ab1',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
        }
      });
    });

    describe('invalid passwords - missing uppercase letter', () => {
      it('should reject password without uppercase letter', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
        }
      });

      it('should reject password with only lowercase and numbers', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'lowercase123456',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
        }
      });

      it('should reject password with only lowercase and special characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'p@ssw0rd!',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
        }
      });
    });

    describe('invalid passwords - missing number', () => {
      it('should reject password without number', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Password',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });

      it('should reject password with only uppercase and lowercase letters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'PasswordTest',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });

      it('should reject password with uppercase and special characters only', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'PASSWORD!@#$',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });
    });

    describe('multiple validation failures', () => {
      it('should show all errors when password is too short and missing uppercase', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'pass1',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.length).toBeGreaterThanOrEqual(2);
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
        }
      });

      it('should show all errors when password is too short and missing number', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Pass',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.length).toBeGreaterThanOrEqual(2);
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });

      it('should show all errors when password is missing both uppercase and number', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.length).toBeGreaterThanOrEqual(2);
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });

      it('should show all errors when password fails all requirements', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'weak',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
          expect(passwordErrors.length).toBeGreaterThanOrEqual(3);
          expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
          expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
          expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
        }
      });
    });

    describe('edge cases', () => {
      it('should accept password with exactly 8 characters', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Abcdef12',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept password with uppercase at different positions', () => {
        const validDataStart = {
          email: 'test@example.com',
          password: 'Password1',
          full_name: 'Test User',
        };
        const validDataMiddle = {
          email: 'test@example.com',
          password: 'passwOrd1',
          full_name: 'Test User',
        };
        const validDataEnd = {
          email: 'test@example.com',
          password: 'password1A',
          full_name: 'Test User',
        };

        expect(signupSchema.safeParse(validDataStart).success).toBe(true);
        expect(signupSchema.safeParse(validDataMiddle).success).toBe(true);
        expect(signupSchema.safeParse(validDataEnd).success).toBe(true);
      });

      it('should accept password with number at different positions', () => {
        const validDataStart = {
          email: 'test@example.com',
          password: '1Password',
          full_name: 'Test User',
        };
        const validDataMiddle = {
          email: 'test@example.com',
          password: 'Pass1word',
          full_name: 'Test User',
        };
        const validDataEnd = {
          email: 'test@example.com',
          password: 'Password1',
          full_name: 'Test User',
        };

        expect(signupSchema.safeParse(validDataStart).success).toBe(true);
        expect(signupSchema.safeParse(validDataMiddle).success).toBe(true);
        expect(signupSchema.safeParse(validDataEnd).success).toBe(true);
      });

      it('should handle unicode characters appropriately', () => {
        const dataWithUnicode = {
          email: 'test@example.com',
          password: 'Pāssw0rd',
          full_name: 'Test User',
        };
        const result = signupSchema.safeParse(dataWithUnicode);
        expect(result.success).toBe(true);
      });
    });

    describe('parse() method throws on invalid input', () => {
      it('should throw ZodError when password is invalid', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'weak',
          full_name: 'Test User',
        };
        expect(() => signupSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should not throw when password is valid', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password1',
          full_name: 'Test User',
        };
        expect(() => signupSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('resetPasswordSchema password validation', () => {
    it('should enforce same password requirements as signup', () => {
      const validData = {
        password: 'Password1',
        confirmPassword: 'Password1',
      };
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password too short', () => {
      const invalidData = {
        password: 'Pass1',
        confirmPassword: 'Pass1',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
        expect(passwordErrors.some(e => e.message.includes('at least 8 characters'))).toBe(true);
      }
    });

    it('should reject password without uppercase', () => {
      const invalidData = {
        password: 'password123',
        confirmPassword: 'password123',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
        expect(passwordErrors.some(e => e.message.includes('uppercase letter'))).toBe(true);
      }
    });

    it('should reject password without number', () => {
      const invalidData = {
        password: 'Password',
        confirmPassword: 'Password',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordErrors = result.error.errors.filter(e => e.path.includes('password'));
        expect(passwordErrors.some(e => e.message.includes('at least one number'))).toBe(true);
      }
    });

    it('should reject when passwords do not match', () => {
      const invalidData = {
        password: 'Password1',
        confirmPassword: 'Password2',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmErrors = result.error.errors.filter(e => e.path.includes('confirmPassword'));
        expect(confirmErrors.some(e => e.message.includes('do not match'))).toBe(true);
      }
    });

    it('should accept valid matching passwords', () => {
      const validData = {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
