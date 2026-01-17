import { test, expect } from '@playwright/test';

test.describe('Development Server', () => {
  test('frontend dev server is running', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('backend dev server is running', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/health');
    expect(response.status()).toBe(200);
  });

  test('frontend can make API requests', async ({ page }) => {
    await page.goto('/');
    // This verifies CORS is configured correctly
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:4000/api/health');
        return { ok: res.ok, status: res.status };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    });
    expect(response.ok).toBe(true);
  });
});
