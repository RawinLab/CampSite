import request from 'supertest';
import app from '../src/app';

describe('Health Endpoint', () => {
  it('returns 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('includes timestamp', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('includes service name', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body).toHaveProperty('service', 'campsite-backend');
  });
});
