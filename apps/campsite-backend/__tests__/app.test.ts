import request from 'supertest';
import app from '../src/app';

describe('Express App', () => {
  it('initializes without errors', () => {
    expect(app).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('handles JSON parsing errors', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('invalid json');
    expect(response.status).toBe(400);
  });
});
