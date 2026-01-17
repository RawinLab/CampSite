import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('E2E: CORS Headers', () => {
  it('includes Access-Control-Allow-Origin header', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('allows credentials', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('handles OPTIONS preflight request', async () => {
    const response = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBeLessThan(400);
  });

  it('includes allowed methods in preflight', async () => {
    const response = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    const allowedMethods = response.headers['access-control-allow-methods'];
    expect(allowedMethods).toBeDefined();
  });

  it('includes allowed headers', async () => {
    const response = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization');

    expect(response.headers['access-control-allow-headers']).toBeDefined();
  });
});
