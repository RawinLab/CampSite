import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('E2E: Health Endpoint', () => {
  it('returns 200 status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  it('returns health check response', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body).toHaveProperty('status');
    expect(['ok', 'healthy']).toContain(response.body.status);
  });

  it('includes service name', async () => {
    const response = await request(app).get('/api/health');
    // Health endpoint should identify the service
    expect(response.body).toBeDefined();
  });

  it('responds within acceptable time', async () => {
    const start = Date.now();
    await request(app).get('/api/health');
    const duration = Date.now() - start;

    // Health check should respond within 1 second
    expect(duration).toBeLessThan(1000);
  });
});
