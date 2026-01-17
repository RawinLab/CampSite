import { signupSchema } from '../../../packages/shared/src/schemas/auth';

/**
 * Integration tests for signup schema validation
 * Testing signup validation rules without full E2E browser testing
 * These tests cover T021-T025 test cases from requirements
 */

describe('Integration: Signup Schema Validation', () => {
  // T021: User can sign up with valid email, password, name
  test('T021: should validate correct signup data', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
      phone: '0812345678',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe(testUser.email);
      expect(result.data.password).toBe(testUser.password);
      expect(result.data.full_name).toBe(testUser.full_name);
      expect(result.data.phone).toBe(testUser.phone);
    }
  });

  // T022: Signup fails with invalid email format
  test('T022: should reject invalid email format', () => {
    const testUser = {
      email: 'invalid-email-format',
      password: 'Test123456',
      full_name: 'Test User',
      phone: '0812345678',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === 'email'
      );
      expect(emailError).toBeDefined();
      expect(emailError?.message).toContain('Invalid email');
    }
  });

  test('T022b: should reject email without domain', () => {
    const testUser = {
      email: 'user@',
      password: 'Test123456',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);
    expect(result.success).toBe(false);
  });

  test('T022c: should reject email without @', () => {
    const testUser = {
      email: 'useremail.com',
      password: 'Test123456',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);
    expect(result.success).toBe(false);
  });

  // T023: Signup fails with weak password (missing uppercase/number)
  test('T023: should reject password without uppercase letter', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'weakpassword123',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        (issue) => issue.path[0] === 'password'
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain('uppercase');
    }
  });

  test('T023b: should reject password without number', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'WeakPassword',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        (issue) => issue.path[0] === 'password'
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain('number');
    }
  });

  test('T023c: should reject password shorter than 8 characters', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test12',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        (issue) => issue.path[0] === 'password'
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain('at least 8 characters');
    }
  });

  test('T023d: should accept strong password with uppercase and number', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'StrongPass123',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);
    expect(result.success).toBe(true);
  });

  // Additional validation tests
  test('should reject name shorter than 2 characters', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'A',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find(
        (issue) => issue.path[0] === 'full_name'
      );
      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('at least 2 characters');
    }
  });

  test('should reject invalid Thai phone number format', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
      phone: '123456',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneError = result.error.issues.find(
        (issue) => issue.path[0] === 'phone'
      );
      expect(phoneError).toBeDefined();
      expect(phoneError?.message).toContain('Invalid Thai phone number');
    }
  });

  test('should accept valid Thai mobile numbers', () => {
    const validPhones = ['0812345678', '0912345678', '0823456789'];

    validPhones.forEach((phone) => {
      const testUser = {
        email: 'test@example.com',
        password: 'Test123456',
        full_name: 'Test User',
        phone,
      };

      const result = signupSchema.safeParse(testUser);
      expect(result.success).toBe(true);
    });
  });

  test('should accept empty phone number', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
      phone: '',
    };

    const result = signupSchema.safeParse(testUser);
    expect(result.success).toBe(true);
  });

  test('should accept undefined phone number', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(testUser);
    expect(result.success).toBe(true);
  });

  test('should handle multiple validation errors', () => {
    const testUser = {
      email: 'invalid-email',
      password: 'weak',
      full_name: 'A',
      phone: '123',
    };

    const result = signupSchema.safeParse(testUser);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have errors for email, password, name, and phone
      expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('Integration: Signup Password Requirements', () => {
  const baseUser = {
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '0812345678',
  };

  test('should enforce minimum 8 characters', () => {
    const shortPasswords = ['Test12', 'Ab1', 'Short1A'];

    shortPasswords.forEach((password) => {
      const result = signupSchema.safeParse({ ...baseUser, password });
      expect(result.success).toBe(false);
    });
  });

  test('should require at least one uppercase letter', () => {
    const noUppercasePasswords = [
      'lowercase123',
      'nouppercasehere1',
      'all_lower_123',
    ];

    noUppercasePasswords.forEach((password) => {
      const result = signupSchema.safeParse({ ...baseUser, password });
      expect(result.success).toBe(false);
    });
  });

  test('should require at least one number', () => {
    const noNumberPasswords = [
      'NoNumberHere',
      'ALLUPPERCASE',
      'MixedCaseOnly',
    ];

    noNumberPasswords.forEach((password) => {
      const result = signupSchema.safeParse({ ...baseUser, password });
      expect(result.success).toBe(false);
    });
  });

  test('should accept passwords meeting all requirements', () => {
    const validPasswords = [
      'Password123',
      'MySecure1Pass',
      'Test@1234',
      'CampsitePass2024',
      'Str0ngP@ssw0rd',
    ];

    validPasswords.forEach((password) => {
      const result = signupSchema.safeParse({ ...baseUser, password });
      expect(result.success).toBe(true);
    });
  });

  test('should accept special characters in password', () => {
    const passwordsWithSpecialChars = [
      'Pass@word123',
      'Test#1234Pass',
      'Secure!Pass1',
      'My$ecure1Pass',
    ];

    passwordsWithSpecialChars.forEach((password) => {
      const result = signupSchema.safeParse({ ...baseUser, password });
      expect(result.success).toBe(true);
    });
  });
});

describe('Integration: Signup Name Validation', () => {
  const baseUser = {
    email: 'test@example.com',
    password: 'Test123456',
    phone: '0812345678',
  };

  test('should accept various name formats', () => {
    const validNames = [
      'John Doe',
      'สมชาย ใจดี',
      'John Smith-Jones',
      "O'Brien",
      'Marie-Claire',
      'José García',
      'นายสมชาย ใจดี',
    ];

    validNames.forEach((full_name) => {
      const result = signupSchema.safeParse({ ...baseUser, full_name });
      expect(result.success).toBe(true);
    });
  });

  test('should accept long names', () => {
    const longName = 'Christopher Alexander Montgomery Wellington III';

    const result = signupSchema.safeParse({ ...baseUser, full_name: longName });
    expect(result.success).toBe(true);
  });

  test('should reject single character names', () => {
    const result = signupSchema.safeParse({ ...baseUser, full_name: 'X' });
    expect(result.success).toBe(false);
  });
});

describe('Integration: Signup Edge Cases', () => {
  test('should handle missing required fields', () => {
    const incompleteData = {
      email: 'test@example.com',
      // missing password and full_name
    };

    const result = signupSchema.safeParse(incompleteData);
    expect(result.success).toBe(false);
  });

  test('should handle empty strings for required fields', () => {
    const emptyData = {
      email: '',
      password: '',
      full_name: '',
      phone: '',
    };

    const result = signupSchema.safeParse(emptyData);
    expect(result.success).toBe(false);
  });

  test('should accept valid data with optional phone omitted', () => {
    const dataWithoutPhone = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
    };

    const result = signupSchema.safeParse(dataWithoutPhone);
    expect(result.success).toBe(true);
  });

  test('should validate email case-insensitivity', () => {
    const emails = [
      'test@example.com',
      'TEST@EXAMPLE.COM',
      'Test@Example.Com',
    ];

    emails.forEach((email) => {
      const result = signupSchema.safeParse({
        email,
        password: 'Test123456',
        full_name: 'Test User',
      });
      expect(result.success).toBe(true);
    });
  });
});
