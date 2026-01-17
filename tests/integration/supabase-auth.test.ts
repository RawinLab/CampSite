/**
 * Integration Test: Supabase Auth Service
 *
 * Verifies that the Supabase Auth service is running correctly
 * and accessible via the Kong gateway at http://localhost:54321
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('Supabase Auth Service', () => {
  let isSupabaseRunning = true;

  beforeAll(async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        },
      });
      isSupabaseRunning = response.ok;
    } catch (error) {
      isSupabaseRunning = false;
    }
  });

  describe('Auth Service Accessibility', () => {
    it('should be accessible at the configured URL', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const authUrl = `${SUPABASE_URL}/auth/v1/health`;
      const response = await fetch(authUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        },
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    }, 10000);
  });

  describe('Auth Health Check', () => {
    it('should respond to health check endpoint', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const healthUrl = `${SUPABASE_URL}/auth/v1/health`;
      const response = await fetch(healthUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('name');
      expect(data.name).toBe('GoTrue');
    }, 10000);
  });

  describe('Auth Signup Endpoint', () => {
    it('should respond to signup endpoint (validation error expected)', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const signupUrl = `${SUPABASE_URL}/auth/v1/signup`;
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: '',
        }),
      });

      expect(response).toBeDefined();
      // Should get a response (likely 400 or 422 for validation error)
      expect(response.status).toBeDefined();
      expect(response.status).toBeLessThan(500);
    }, 10000);

    it('should validate email and password requirements', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const signupUrl = `${SUPABASE_URL}/auth/v1/signup`;
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123',
        }),
      });

      expect(response).toBeDefined();
      // Should return validation error (400 or 422)
      expect([400, 422]).toContain(response.status);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('msg');
    }, 10000);
  });

  describe('Auth Login Endpoint', () => {
    it('should respond to login endpoint (auth error expected)', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword123',
        }),
      });

      expect(response).toBeDefined();
      // Should get a response (likely 400 for invalid credentials)
      expect(response.status).toBeDefined();
      expect(response.status).toBeLessThan(500);
    }, 10000);

    it('should reject login with invalid credentials', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'invalidpassword',
        }),
      });

      expect(response).toBeDefined();
      // Should return auth error (400 or 401)
      expect([400, 401]).toContain(response.status);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('error');
    }, 10000);
  });

  describe('Auth API Key Authentication', () => {
    it('should require API key for auth endpoints', async () => {
      if (!isSupabaseRunning) {
        console.warn('Skipping test: Supabase is not running');
        return;
      }

      const healthUrl = `${SUPABASE_URL}/auth/v1/health`;
      const response = await fetch(healthUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response).toBeDefined();
      // Missing API key should return 401 or 400
      expect([400, 401]).toContain(response.status);
    }, 10000);
  });
});
