import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('E2E: Server Start', () => {
  it('starts without errors', () => {
    expect(app).toBeDefined();
  });

  it('responds to requests', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBeLessThan(500);
  });

  it('handles multiple concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBeLessThan(500);
    });
  });
});
