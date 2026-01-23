/**
 * E2E Test API Helper Utilities
 *
 * Shared utilities for API interception, verification, and testing.
 * These helpers ensure tests properly verify API calls instead of just UI elements.
 */

import { Page, Response, Route, Request } from '@playwright/test';

// API URLs
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3091';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3090';

/**
 * API Response interface for typed assertions
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Wait for a specific API endpoint to be called and return the response
 * This is the PRIMARY way to verify API calls in E2E tests
 *
 * @example
 * const response = await waitForApi(page, '/api/admin/campsites/pending');
 * expect(response.status()).toBe(200);
 * const data = await response.json();
 * expect(data.success).toBe(true);
 */
export async function waitForApi(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    method?: string;
    status?: number;
    timeout?: number;
  } = {}
): Promise<Response> {
  const { method, status, timeout = 30000 } = options;

  return page.waitForResponse(
    (response) => {
      const url = response.url();
      const urlMatches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

      if (!urlMatches) return false;
      if (method && response.request().method() !== method.toUpperCase()) return false;
      if (status !== undefined && response.status() !== status) return false;

      return true;
    },
    { timeout }
  );
}

/**
 * Wait for API and verify it returns success
 * Combines waiting and assertion in one call
 *
 * @example
 * const data = await waitForApiSuccess(page, '/api/admin/stats');
 * expect(data.pending_campsites).toBeGreaterThanOrEqual(0);
 */
export async function waitForApiSuccess<T = unknown>(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    method?: string;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const response = await waitForApi(page, urlPattern, {
    ...options,
    status: 200,
  });

  const json = await response.json() as ApiResponse<T>;

  if (!json.success) {
    throw new Error(`API returned success=false: ${json.error || 'Unknown error'}`);
  }

  return json;
}

/**
 * Wait for multiple API calls to complete
 * Useful when a page makes several API calls on load
 *
 * @example
 * const responses = await waitForMultipleApis(page, [
 *   '/api/admin/stats',
 *   '/api/admin/campsites/pending'
 * ]);
 */
export async function waitForMultipleApis(
  page: Page,
  urlPatterns: (string | RegExp)[],
  options: { timeout?: number } = {}
): Promise<Response[]> {
  const { timeout = 30000 } = options;

  const promises = urlPatterns.map(pattern =>
    waitForApi(page, pattern, { timeout })
  );

  return Promise.all(promises);
}

/**
 * Intercept and mock an API response
 * Use for testing error scenarios
 *
 * @example
 * await mockApiResponse(page, '/api/admin/stats', {
 *   status: 500,
 *   body: { success: false, error: 'Server error' }
 * });
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: {
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<void> {
  await page.route(
    (url) => {
      const urlStr = url.toString();
      return typeof urlPattern === 'string'
        ? urlStr.includes(urlPattern)
        : urlPattern.test(urlStr);
    },
    (route) => {
      route.fulfill({
        status: response.status || 200,
        contentType: 'application/json',
        headers: response.headers,
        body: JSON.stringify(response.body || { success: true }),
      });
    }
  );
}

/**
 * Intercept API call and capture the request for assertion
 * Useful for verifying request body, headers, etc.
 *
 * @example
 * const { request, response } = await interceptApi(page, '/api/admin/campsites/123/approve', {
 *   method: 'POST'
 * });
 * expect(request.method()).toBe('POST');
 */
export async function interceptApi(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    method?: string;
    timeout?: number;
  } = {}
): Promise<{ request: Request; response: Response }> {
  const { method, timeout = 30000 } = options;

  let capturedRequest: Request | null = null;

  // Set up request listener
  const requestPromise = new Promise<Request>((resolve) => {
    const handler = (request: Request) => {
      const url = request.url();
      const urlMatches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

      if (urlMatches && (!method || request.method() === method.toUpperCase())) {
        capturedRequest = request;
        page.off('request', handler);
        resolve(request);
      }
    };
    page.on('request', handler);
  });

  // Wait for both request and response
  const [request, response] = await Promise.all([
    requestPromise,
    waitForApi(page, urlPattern, { method, timeout }),
  ]);

  return { request, response };
}

/**
 * Verify that an API was NOT called
 * Useful for testing that unauthorized actions don't trigger API calls
 *
 * @example
 * await verifyApiNotCalled(page, '/api/admin/', async () => {
 *   await page.goto('/admin/campsites/pending');
 * });
 */
export async function verifyApiNotCalled(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  options: { waitTime?: number } = {}
): Promise<void> {
  const { waitTime = 3000 } = options;

  let apiCalled = false;

  const handler = (request: Request) => {
    const url = request.url();
    const urlMatches = typeof urlPattern === 'string'
      ? url.includes(urlPattern)
      : urlPattern.test(url);

    if (urlMatches) {
      apiCalled = true;
    }
  };

  page.on('request', handler);

  try {
    await action();
    await page.waitForTimeout(waitTime);
  } finally {
    page.off('request', handler);
  }

  if (apiCalled) {
    throw new Error(`API matching ${urlPattern} was called when it should not have been`);
  }
}

/**
 * Navigate to a page and wait for its primary API call to succeed
 * This is the recommended way to navigate in E2E tests
 *
 * @example
 * const data = await gotoWithApi(page, '/admin/campsites/pending', '/api/admin/campsites/pending');
 * expect(data.data.length).toBeGreaterThanOrEqual(0);
 */
export async function gotoWithApi<T = unknown>(
  page: Page,
  pageUrl: string,
  apiPattern: string | RegExp,
  options: {
    method?: string;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', timeout = 30000 } = options;

  // Start waiting for API before navigation
  const apiPromise = waitForApiSuccess<T>(page, apiPattern, { method, timeout });

  // Navigate
  await page.goto(pageUrl);

  // Wait for API to complete
  return apiPromise;
}

/**
 * Assert that no error messages are shown on the page
 * Call this after navigation to ensure page loaded successfully
 *
 * @example
 * await assertNoErrors(page);
 */
export async function assertNoErrors(page: Page): Promise<void> {
  // Common error patterns
  const errorPatterns = [
    '[data-testid="error-message"]',
    '[data-testid="error-alert"]',
    '.error-message',
    '.error-alert',
    'text=Error:',
    'text=Failed to',
    'text=Something went wrong',
    'text=Access Denied',
    'text=Unauthorized',
  ];

  for (const pattern of errorPatterns) {
    const element = page.locator(pattern).first();
    const isVisible = await element.isVisible().catch(() => false);

    if (isVisible) {
      const text = await element.textContent().catch(() => 'Unknown error');
      throw new Error(`Error visible on page: ${text}`);
    }
  }
}

/**
 * Wait for page to finish loading (no pending network requests)
 * More reliable than waitForTimeout
 */
export async function waitForPageReady(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Create a unique test identifier
 * Use this to create identifiable test data
 *
 * @example
 * const testName = createTestId('campsite');
 * // Returns: 'E2E-campsite-1705123456789'
 */
export function createTestId(prefix: string): string {
  return `E2E-${prefix}-${Date.now()}`;
}

/**
 * Verify API response matches expected structure
 *
 * @example
 * await verifyApiResponse(response, {
 *   success: true,
 *   hasData: true,
 *   dataIsArray: true
 * });
 */
export async function verifyApiResponse(
  response: Response,
  expectations: {
    status?: number;
    success?: boolean;
    hasData?: boolean;
    dataIsArray?: boolean;
    hasError?: boolean;
    hasPagination?: boolean;
  }
): Promise<ApiResponse> {
  const {
    status = 200,
    success = true,
    hasData,
    dataIsArray,
    hasError,
    hasPagination,
  } = expectations;

  if (response.status() !== status) {
    throw new Error(`Expected status ${status}, got ${response.status()}`);
  }

  const json = await response.json() as ApiResponse;

  if (json.success !== success) {
    throw new Error(`Expected success=${success}, got success=${json.success}`);
  }

  if (hasData && json.data === undefined) {
    throw new Error('Expected response to have data property');
  }

  if (dataIsArray && !Array.isArray(json.data)) {
    throw new Error('Expected data to be an array');
  }

  if (hasError && !json.error) {
    throw new Error('Expected response to have error property');
  }

  if (hasPagination && !json.pagination) {
    throw new Error('Expected response to have pagination property');
  }

  return json;
}

/**
 * Admin API endpoints for reference
 */
export const ADMIN_API = {
  stats: '/api/admin/stats',
  pendingCampsites: '/api/admin/campsites/pending',
  approveCampsite: (id: string) => `/api/admin/campsites/${id}/approve`,
  rejectCampsite: (id: string) => `/api/admin/campsites/${id}/reject`,
  ownerRequests: '/api/admin/owner-requests',
  approveOwnerRequest: (id: string) => `/api/admin/owner-requests/${id}/approve`,
  rejectOwnerRequest: (id: string) => `/api/admin/owner-requests/${id}/reject`,
  reportedReviews: '/api/admin/reviews/reported',
  hideReview: (id: string) => `/api/admin/reviews/${id}/hide`,
  unhideReview: (id: string) => `/api/admin/reviews/${id}/unhide`,
  deleteReview: (id: string) => `/api/admin/reviews/${id}`,
  googlePlaces: {
    stats: '/api/admin/google-places/stats',
    syncLogs: '/api/admin/google-places/sync/logs',
    syncStatus: '/api/admin/google-places/sync/status',
    triggerSync: '/api/admin/google-places/sync/trigger',
    candidates: '/api/admin/google-places/candidates',
    process: '/api/admin/google-places/process',
  },
} as const;

/**
 * Dashboard API endpoints for reference
 */
export const DASHBOARD_API = {
  myCampsites: '/api/owner/campsites',
  createCampsite: '/api/owner/campsites',
  updateCampsite: (id: string) => `/api/owner/campsites/${id}`,
  deleteCampsite: (id: string) => `/api/owner/campsites/${id}`,
  inquiries: '/api/owner/inquiries',
  inquiryDetail: (id: string) => `/api/owner/inquiries/${id}`,
  analytics: '/api/owner/analytics',
  uploadPhoto: '/api/owner/photos/upload',
} as const;

/**
 * Public API endpoints for reference
 */
export const PUBLIC_API = {
  campsites: '/api/campsites',
  campsiteDetail: (id: string) => `/api/campsites/${id}`,
  reviews: (campsiteId: string) => `/api/campsites/${campsiteId}/reviews`,
  submitReview: (campsiteId: string) => `/api/campsites/${campsiteId}/reviews`,
  reportReview: (reviewId: string) => `/api/reviews/${reviewId}/report`,
  voteHelpful: (reviewId: string) => `/api/reviews/${reviewId}/helpful`,
  search: '/api/search',
  provinces: '/api/provinces',
  amenities: '/api/amenities',
  campsiteTypes: '/api/campsite-types',
  inquiry: '/api/inquiries',
} as const;

/**
 * Wishlist API endpoints for reference
 */
export const WISHLIST_API = {
  list: '/api/wishlist',
  add: '/api/wishlist',
  remove: (campsiteId: string) => `/api/wishlist/${campsiteId}`,
  check: (campsiteId: string) => `/api/wishlist/check/${campsiteId}`,
  checkBatch: '/api/wishlist/check-batch',
  count: '/api/wishlist/count',
} as const;
