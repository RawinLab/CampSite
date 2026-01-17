import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('E2E: Auth Middleware', () => {
  describe('Protected endpoints', () => {
    it('rejects request without token', async () => {
      // Try to access a protected endpoint without auth
      const response = await request(app).get('/api/auth/me');

      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
    });

    it('rejects request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('rejects request with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });

    it('rejects request with wrong auth scheme', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic sometoken');

      expect(response.status).toBe(401);
    });
  });

  describe('Public endpoints', () => {
    it('allows access to health endpoint without auth', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Error response format', () => {
    it('returns proper error structure for auth failures', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.body).toHaveProperty('error');
      // Error message should indicate authentication issue
      expect(response.body.error).toBeDefined();
    });
  });
});
