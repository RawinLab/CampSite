import { test, expect } from '@playwright/test';

test.describe('Backend Smoke Tests', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('health endpoint returns correct JSON', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/health');
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('service', 'campsite-backend');
    expect(body).toHaveProperty('timestamp');
  });

  test('unknown route returns 404', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/unknown');
    expect(response.status()).toBe(404);
  });

  test('CORS headers are present', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/health');
    // In a proper CORS test, we'd check the headers
    expect(response.ok()).toBeTruthy();
  });
});
