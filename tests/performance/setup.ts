/**
 * Performance tests setup file
 * Configures browser launch and cleanup for Core Web Vitals tests
 */
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

// Global browser instance for all tests
let browser: Browser | null = null;

// Increase timeout for performance tests
jest.setTimeout(60000);

/**
 * Check if we're in CI environment
 */
export const isCI = (): boolean => {
  return Boolean(process.env.CI);
};

/**
 * Get the base URL for tests
 */
export const getBaseUrl = (): string => {
  return process.env.BASE_URL || 'http://localhost:3090';
};

/**
 * Get browser launch options based on environment
 */
export const getBrowserOptions = () => ({
  headless: true,
  args: [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    // Enable performance APIs
    '--enable-precise-memory-info',
    '--enable-features=PerformanceObserverBuffering',
  ],
});

/**
 * Launch browser before all tests
 */
beforeAll(async () => {
  try {
    browser = await chromium.launch(getBrowserOptions());
  } catch (error) {
    console.warn('Failed to launch browser. Performance tests may be skipped in CI.');
    console.warn(error);
  }
});

/**
 * Close browser after all tests
 */
afterAll(async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
});

/**
 * Get the browser instance
 */
export const getBrowser = (): Browser | null => browser;

/**
 * Create a new browser context with performance-friendly settings
 */
export const createContext = async (options: {
  offline?: boolean;
  networkConditions?: 'fast3g' | 'slow3g' | 'offline';
} = {}): Promise<BrowserContext | null> => {
  if (!browser) {
    return null;
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    bypassCSP: true,
    // Enable JavaScript for full page rendering
    javaScriptEnabled: true,
  });

  return context;
};

/**
 * Create a new page with CDP session for advanced metrics
 */
export const createPageWithCDP = async (
  context: BrowserContext
): Promise<{ page: Page; cdp: any } | null> => {
  const page = await context.newPage();

  // Get CDP session for advanced metrics
  const cdp = await page.context().newCDPSession(page);

  // Enable performance domain
  await cdp.send('Performance.enable');

  return { page, cdp };
};

/**
 * Network throttling presets
 */
interface NetworkPreset {
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
  offline?: boolean;
}

export const NETWORK_PRESETS: Record<string, NetworkPreset> = {
  fast3g: {
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 kbps
    latency: 40, // 40ms RTT
  },
  slow3g: {
    downloadThroughput: (400 * 1024) / 8, // 400 kbps
    uploadThroughput: (400 * 1024) / 8, // 400 kbps
    latency: 400, // 400ms RTT
  },
  offline: {
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
    offline: true,
  },
};

/**
 * Apply network throttling via CDP
 */
export const applyNetworkThrottling = async (
  cdp: any,
  preset: keyof typeof NETWORK_PRESETS
): Promise<void> => {
  const config = NETWORK_PRESETS[preset];
  await cdp.send('Network.emulateNetworkConditions', {
    offline: config.offline ?? false,
    downloadThroughput: config.downloadThroughput,
    uploadThroughput: config.uploadThroughput,
    latency: config.latency,
  });
};

/**
 * Clear network throttling
 */
export const clearNetworkThrottling = async (cdp: any): Promise<void> => {
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
};
