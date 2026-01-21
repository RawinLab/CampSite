import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Smoke Test: Pages Load Successfully', () => {
  test('homepage loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const startTime = Date.now();
    const response = await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Verify HTTP status
    expect(response?.status()).toBe(200);

    // Verify page loaded in under 10 seconds (development environment may be slower)
    expect(loadTime, 'Homepage load time exceeded 10 seconds').toBeLessThan(10000);

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Verify no console errors
    expect(consoleErrors, `Console errors on homepage: ${consoleErrors.join(', ')}`).toHaveLength(0);

    // Verify no page errors
    expect(pageErrors, `Page errors on homepage: ${pageErrors.join(', ')}`).toHaveLength(0);

    // Verify critical elements are present
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('search page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const startTime = Date.now();
    const response = await page.goto('/search');
    const loadTime = Date.now() - startTime;

    // Verify HTTP status
    expect(response?.status()).toBe(200);

    // Verify page loaded in under 10 seconds (development environment may be slower)
    expect(loadTime, 'Search page load time exceeded 10 seconds').toBeLessThan(10000);

    await page.waitForLoadState('domcontentloaded');

    // Verify no errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);

    // Verify search functionality is present
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="ค้นหา"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('login page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const startTime = Date.now();
    const response = await page.goto('/auth/login');
    const loadTime = Date.now() - startTime;

    // Verify HTTP status
    expect(response?.status()).toBe(200);

    // Verify page loaded in under 10 seconds (development environment may be slower)
    expect(loadTime, 'Login page load time exceeded 10 seconds').toBeLessThan(10000);

    await page.waitForLoadState('domcontentloaded');

    // Verify no errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);

    // Verify login form is present
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('register page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const startTime = Date.now();
    const response = await page.goto('/auth/signup');
    const loadTime = Date.now() - startTime;

    // Verify HTTP status
    expect(response?.status()).toBe(200);

    // Verify page loaded in under 10 seconds (development environment may be slower)
    expect(loadTime, 'Register page load time exceeded 10 seconds').toBeLessThan(10000);

    await page.waitForLoadState('domcontentloaded');

    // Verify no errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);

    // Verify registration form is present
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('campsite detail page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const startTime = Date.now();
    // Use a known campsite ID or slug from test data
    const response = await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    const loadTime = Date.now() - startTime;

    // Verify HTTP status (200 or 404 are both acceptable for smoke test)
    const status = response?.status();
    expect(status).toBeDefined();
    expect([200, 404]).toContain(status);

    // Verify page loaded in under 10 seconds (development environment may be slower)
    expect(loadTime, 'Campsite detail page load time exceeded 10 seconds').toBeLessThan(10000);

    await page.waitForLoadState('domcontentloaded');

    // Verify no console errors (even for 404 page)
    expect(consoleErrors, `Console errors on detail page: ${consoleErrors.join(', ')}`).toHaveLength(0);

    // Verify no page errors
    expect(pageErrors, `Page errors on detail page: ${pageErrors.join(', ')}`).toHaveLength(0);
  });

  test('invalid route returns 404 without crashing', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore expected 404-related console errors
        const text = msg.text();
        if (!text.includes('404') && !text.includes('Not Found')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const response = await page.goto('/this-route-does-not-exist-12345');

    // Verify 404 status
    expect(response?.status()).toBe(404);

    await page.waitForLoadState('domcontentloaded');

    // Verify no JavaScript errors (404 page should still work, ignoring expected 404 resource errors)
    expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);

    // Verify 404 page has content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('all pages have proper HTML structure', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/auth/login', '/auth/signup'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      // Verify basic HTML structure
      const html = page.locator('html');
      const head = page.locator('head');
      const body = page.locator('body');

      await expect(html).toBeVisible();
      await expect(head).toBeAttached();
      await expect(body).toBeVisible();

      // Verify title exists
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('navigation between pages works smoothly', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to search
    const startTime = Date.now();
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');
    const navTime = Date.now() - startTime;

    // Verify navigation was fast
    expect(navTime, 'Navigation to search page too slow').toBeLessThan(10000);

    // Navigate to login
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on login page
    const loginForm = page.locator('input[type="email"]');
    await expect(loginForm).toBeVisible();
  });

  test('API endpoints respond correctly', async ({ page }) => {
    const apiCalls: { url: string; status: number }[] = [];
    const failedCalls: { url: string; status: number }[] = [];

    // Monitor API responses
    page.on('response', response => {
      const url = response.url();

      // Track API calls
      if (url.includes('/api/') || url.includes('localhost:4000')) {
        const callInfo = {
          url,
          status: response.status(),
        };

        apiCalls.push(callInfo);

        // Track failed calls (5xx errors are failures, 4xx might be expected)
        if (response.status() >= 500) {
          failedCalls.push(callInfo);
        }
      }
    });

    // Load homepage which should make some API calls
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Network idle might timeout, that's okay
    });

    // Verify no 5xx errors occurred
    expect(failedCalls, `Server errors detected: ${JSON.stringify(failedCalls)}`).toHaveLength(0);
  });

  test('critical resources load successfully', async ({ page }) => {
    const failedResources: string[] = [];

    // Monitor failed requests
    page.on('response', response => {
      const url = response.url();
      const status = response.status();

      // Track failed critical resources (CSS, JS, fonts)
      if (status >= 400 && (
        url.endsWith('.css') ||
        url.endsWith('.js') ||
        url.endsWith('.woff') ||
        url.endsWith('.woff2') ||
        url.endsWith('.ttf')
      )) {
        failedResources.push(`${url} (${status})`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Verify no critical resources failed
    expect(failedResources, `Critical resources failed to load: ${failedResources.join(', ')}`).toHaveLength(0);
  });

  test('pages are responsive and render on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const pagesToTest = ['/', '/search', '/auth/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      // Verify page renders without horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll, `Page ${pagePath} has unwanted horizontal scroll on mobile`).toBe(false);

      // Verify content is visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('session state persists across page navigation', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check if localStorage works
    await page.evaluate(() => {
      localStorage.setItem('smoke-test', 'true');
    });

    // Navigate to another page
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');

    // Verify localStorage persisted
    const storageValue = await page.evaluate(() => {
      return localStorage.getItem('smoke-test');
    });

    expect(storageValue).toBe('true');

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('smoke-test');
    });
  });
});
