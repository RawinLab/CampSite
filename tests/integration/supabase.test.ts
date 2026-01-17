/**
 * Integration Test: Supabase Docker Instance Connectivity
 *
 * Verifies that the local Supabase instance is running and accessible
 * via Docker Compose at http://localhost:8000
 */

import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_ANON_KEY = process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('Supabase Docker Instance Connectivity', () => {
  describe('Configuration', () => {
    it('should have supabase/config.toml file', () => {
      const configPath = path.join(__dirname, '../../supabase/config.toml');
      expect(fs.existsSync(configPath)).toBe(true);

      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toBeTruthy();
      expect(configContent.length).toBeGreaterThan(0);
    });

    it('should have ANON_KEY environment variable or default', () => {
      expect(SUPABASE_ANON_KEY).toBeTruthy();
      expect(SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway Connection', () => {
    it('should connect to Kong API Gateway at http://localhost:8000', async () => {
      const response = await fetch(SUPABASE_URL);
      expect(response).toBeDefined();
      // Kong gateway may return various status codes (200, 404, etc.) but should be reachable
      expect(response.status).toBeDefined();
    }, 10000);

    it('should respond to health endpoint', async () => {
      const healthUrl = `${SUPABASE_URL}/rest/v1/`;
      const response = await fetch(healthUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      // Should get a response (200 or 404 for root endpoint is acceptable)
      expect(response).toBeDefined();
      expect(response.status).toBeLessThan(500); // No server errors
    }, 10000);
  });

  describe('API Key Authentication', () => {
    it('should authenticate with API key on REST endpoint', async () => {
      const restUrl = `${SUPABASE_URL}/rest/v1/`;
      const response = await fetch(restUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      // Valid API key should not return 401 Unauthorized
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    }, 10000);

    it('should reject requests without API key', async () => {
      const restUrl = `${SUPABASE_URL}/rest/v1/`;
      const response = await fetch(restUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Missing API key should return 401 or 400
      expect([400, 401]).toContain(response.status);
    }, 10000);
  });

  describe('PostgREST Endpoint', () => {
    it('should access PostgREST API', async () => {
      const restUrl = `${SUPABASE_URL}/rest/v1/`;
      const response = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response).toBeDefined();
      // PostgREST should be accessible
      expect(response.status).toBeLessThan(500);
    }, 10000);
  });

  describe('Auth Endpoint', () => {
    it('should access Supabase Auth endpoint', async () => {
      const authUrl = `${SUPABASE_URL}/auth/v1/health`;
      const response = await fetch(authUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        },
      });

      expect(response).toBeDefined();
      // Auth health endpoint should respond with 200
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
    }, 10000);
  });
});
