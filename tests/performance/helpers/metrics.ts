/**
 * Core Web Vitals Metrics Collection Utilities
 *
 * Provides helper functions to collect LCP, FID/INP, and CLS metrics
 * using Performance Observer and CDP (Chrome DevTools Protocol)
 */
import { Page } from '@playwright/test';

/**
 * Core Web Vitals thresholds (Google's recommendations)
 */
export const THRESHOLDS = {
  // Largest Contentful Paint
  LCP: {
    GOOD: 2500, // ms
    NEEDS_IMPROVEMENT: 4000, // ms
    POOR: 4000, // anything above is poor
  },
  // First Input Delay / Interaction to Next Paint
  FID: {
    GOOD: 100, // ms
    NEEDS_IMPROVEMENT: 300, // ms
    POOR: 300, // anything above is poor
  },
  INP: {
    GOOD: 200, // ms
    NEEDS_IMPROVEMENT: 500, // ms
    POOR: 500, // anything above is poor
  },
  // Cumulative Layout Shift
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
    POOR: 0.25, // anything above is poor
  },
  // Time to First Byte
  TTFB: {
    GOOD: 800, // ms
    NEEDS_IMPROVEMENT: 1800, // ms
    POOR: 1800,
  },
  // First Contentful Paint
  FCP: {
    GOOD: 1800, // ms
    NEEDS_IMPROVEMENT: 3000, // ms
    POOR: 3000,
  },
};

/**
 * LCP entry interface
 */
export interface LCPEntry {
  element: string;
  startTime: number;
  size: number;
  url?: string;
  id?: string;
  renderTime: number;
  loadTime: number;
}

/**
 * CLS entry interface
 */
export interface CLSEntry {
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node: string;
    previousRect: DOMRect | null;
    currentRect: DOMRect | null;
  }>;
}

/**
 * INP/FID entry interface
 */
export interface InteractionEntry {
  name: string;
  duration: number;
  startTime: number;
  processingStart: number;
  processingEnd: number;
  interactionId?: number;
}

/**
 * Navigation timing metrics
 */
export interface NavigationMetrics {
  ttfb: number;
  fcp: number;
  domContentLoaded: number;
  domInteractive: number;
  loadComplete: number;
  domComplete: number;
}

/**
 * Collect Largest Contentful Paint (LCP) metric
 */
export const collectLCP = async (page: Page, timeout = 10000): Promise<LCPEntry | null> => {
  return page.evaluate((timeoutMs) => {
    return new Promise<LCPEntry | null>((resolve) => {
      let lastLCPEntry: LCPEntry | null = null;
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(lastLCPEntry);
      }, timeoutMs);

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const lcpEntry = entry as any;
          lastLCPEntry = {
            element: lcpEntry.element?.tagName || 'unknown',
            startTime: lcpEntry.startTime,
            size: lcpEntry.size,
            url: lcpEntry.url || undefined,
            id: lcpEntry.id || undefined,
            renderTime: lcpEntry.renderTime || 0,
            loadTime: lcpEntry.loadTime || 0,
          };
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        clearTimeout(timeoutId);
        resolve(null);
      }

      // LCP is finalized on user interaction or page hide
      // For testing, we wait for the timeout or visibilitychange
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(lastLCPEntry);
        }
      }, { once: true });
    });
  }, timeout);
};

/**
 * Collect LCP with polling (more reliable for tests)
 */
export const collectLCPWithPolling = async (
  page: Page,
  maxWait = 10000,
  pollInterval = 100
): Promise<LCPEntry | null> => {
  const startTime = Date.now();

  // Inject LCP collection script
  await page.evaluate(() => {
    (window as any).__lcpEntries = [];
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const lcpEntry = entry as any;
        (window as any).__lcpEntries.push({
          element: lcpEntry.element?.tagName || 'unknown',
          startTime: lcpEntry.startTime,
          size: lcpEntry.size,
          url: lcpEntry.url || undefined,
          id: lcpEntry.id || undefined,
          renderTime: lcpEntry.renderTime || 0,
          loadTime: lcpEntry.loadTime || 0,
        });
      }
    });
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observer not supported');
    }
    (window as any).__lcpObserver = observer;
  });

  // Poll for LCP entries
  while (Date.now() - startTime < maxWait) {
    await page.waitForTimeout(pollInterval);

    const entries = await page.evaluate(() => {
      return (window as any).__lcpEntries || [];
    });

    if (entries.length > 0) {
      // Cleanup observer
      await page.evaluate(() => {
        if ((window as any).__lcpObserver) {
          (window as any).__lcpObserver.disconnect();
        }
      });
      return entries[entries.length - 1] as LCPEntry;
    }
  }

  return null;
};

/**
 * Collect Cumulative Layout Shift (CLS) metric
 */
export const collectCLS = async (page: Page, observeDuration = 5000): Promise<number> => {
  return page.evaluate((duration) => {
    return new Promise<number>((resolve) => {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          // Only count if there's no recent input
          if (!layoutShift.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If entry is within 1s of the previous entry and less than 5s
            // from the first entry in the session, add to current session
            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += layoutShift.value;
              sessionEntries.push(entry);
            } else {
              // Start new session
              sessionValue = layoutShift.value;
              sessionEntries = [entry];
            }

            // Update max CLS
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
            }
          }
        }
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        resolve(0);
        return;
      }

      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, duration);
    });
  }, observeDuration);
};

/**
 * Collect all CLS entries with details
 */
export const collectCLSEntries = async (
  page: Page,
  observeDuration = 5000
): Promise<CLSEntry[]> => {
  return page.evaluate((duration) => {
    return new Promise<CLSEntry[]>((resolve) => {
      const entries: CLSEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          entries.push({
            value: layoutShift.value,
            hadRecentInput: layoutShift.hadRecentInput,
            sources: (layoutShift.sources || []).map((source: any) => ({
              node: source.node?.tagName || 'unknown',
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        resolve([]);
        return;
      }

      setTimeout(() => {
        observer.disconnect();
        resolve(entries);
      }, duration);
    });
  }, observeDuration);
};

/**
 * Collect First Input Delay (FID) by simulating user interaction
 */
export const collectFID = async (
  page: Page,
  selector: string,
  action: 'click' | 'focus' | 'keypress' = 'click'
): Promise<number> => {
  // Setup FID observer before interaction
  await page.evaluate(() => {
    (window as any).__fidValue = null;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const fidEntry = entry as any;
        (window as any).__fidValue = fidEntry.processingStart - fidEntry.startTime;
      }
    });
    try {
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observer not supported');
    }
    (window as any).__fidObserver = observer;
  });

  // Perform the interaction
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible', timeout: 5000 });

  switch (action) {
    case 'click':
      await element.click();
      break;
    case 'focus':
      await element.focus();
      break;
    case 'keypress':
      await element.press('Enter');
      break;
  }

  // Wait a bit for the metric to be recorded
  await page.waitForTimeout(100);

  // Collect FID value
  const fidValue = await page.evaluate(() => {
    if ((window as any).__fidObserver) {
      (window as any).__fidObserver.disconnect();
    }
    return (window as any).__fidValue;
  });

  return fidValue || 0;
};

/**
 * Collect Interaction to Next Paint (INP) metrics
 */
export const collectINP = async (
  page: Page,
  interactionDuration = 5000
): Promise<InteractionEntry[]> => {
  // Setup event-timing observer
  await page.evaluate(() => {
    (window as any).__interactions = [];
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const eventEntry = entry as any;
        if (eventEntry.interactionId) {
          (window as any).__interactions.push({
            name: eventEntry.name,
            duration: eventEntry.duration,
            startTime: eventEntry.startTime,
            processingStart: eventEntry.processingStart,
            processingEnd: eventEntry.processingEnd,
            interactionId: eventEntry.interactionId,
          });
        }
      }
    });
    try {
      observer.observe({ type: 'event', buffered: true, durationThreshold: 0 } as any);
    } catch (e) {
      console.warn('Event timing observer not supported');
    }
    (window as any).__inpObserver = observer;
  });

  // Wait for interactions to be collected
  await page.waitForTimeout(interactionDuration);

  // Collect and cleanup
  const interactions = await page.evaluate(() => {
    if ((window as any).__inpObserver) {
      (window as any).__inpObserver.disconnect();
    }
    return (window as any).__interactions || [];
  });

  return interactions as InteractionEntry[];
};

/**
 * Calculate INP from collected interactions
 * INP is the 98th percentile of all interactions
 */
export const calculateINP = (interactions: InteractionEntry[]): number => {
  if (interactions.length === 0) return 0;

  // Sort by duration
  const sorted = [...interactions].sort((a, b) => a.duration - b.duration);

  // Get 98th percentile (or highest if few interactions)
  const index = Math.min(
    Math.ceil(sorted.length * 0.98) - 1,
    sorted.length - 1
  );

  return sorted[index].duration;
};

/**
 * Measure interaction latency manually
 */
export const measureInteractionLatency = async (
  page: Page,
  selector: string,
  action: () => Promise<void>
): Promise<number> => {
  // Record start time in browser
  await page.evaluate(() => {
    (window as any).__interactionStart = performance.now();
  });

  // Perform action
  await action();

  // Calculate time to visual feedback
  const latency = await page.evaluate(() => {
    const end = performance.now();
    return end - (window as any).__interactionStart;
  });

  return latency;
};

/**
 * Collect navigation timing metrics
 */
export const collectNavigationMetrics = async (
  page: Page
): Promise<NavigationMetrics> => {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');

    return {
      ttfb: navigation.responseStart - navigation.fetchStart,
      fcp: fcp?.startTime || 0,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.fetchStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
    };
  });
};

/**
 * Collect resource loading metrics
 */
export const collectResourceMetrics = async (
  page: Page
): Promise<{
  totalResources: number;
  totalSize: number;
  slowestResource: { name: string; duration: number } | null;
  resourcesByType: Record<string, number>;
}> => {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];

    let slowestResource: { name: string; duration: number } | null = null;
    let totalSize = 0;
    const resourcesByType: Record<string, number> = {};

    for (const resource of resources) {
      const duration = resource.responseEnd - resource.startTime;
      const size = resource.transferSize || 0;

      totalSize += size;

      // Track slowest resource
      if (!slowestResource || duration > slowestResource.duration) {
        slowestResource = { name: resource.name, duration };
      }

      // Count by type
      const type = resource.initiatorType;
      resourcesByType[type] = (resourcesByType[type] || 0) + 1;
    }

    return {
      totalResources: resources.length,
      totalSize,
      slowestResource,
      resourcesByType,
    };
  });
};

/**
 * Wait for LCP element to be visible
 */
export const waitForLCPElement = async (
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> => {
  try {
    await page.locator(selector).first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get element dimensions and position
 */
export const getElementMetrics = async (
  page: Page,
  selector: string
): Promise<{
  width: number;
  height: number;
  x: number;
  y: number;
  isVisible: boolean;
} | null> => {
  const element = page.locator(selector).first();
  const isVisible = await element.isVisible().catch(() => false);

  if (!isVisible) {
    return null;
  }

  const box = await element.boundingBox();
  if (!box) {
    return null;
  }

  return {
    width: box.width,
    height: box.height,
    x: box.x,
    y: box.y,
    isVisible: true,
  };
};

/**
 * Check if images have explicit dimensions
 */
export const checkImageDimensions = async (
  page: Page
): Promise<
  Array<{
    src: string;
    hasWidth: boolean;
    hasHeight: boolean;
    naturalWidth: number;
    naturalHeight: number;
    displayWidth: number;
    displayHeight: number;
  }>
> => {
  return page.evaluate(() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).map((img) => ({
      src: img.src.substring(0, 100), // Truncate for logging
      hasWidth: img.hasAttribute('width') || img.style.width !== '',
      hasHeight: img.hasAttribute('height') || img.style.height !== '',
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.clientWidth,
      displayHeight: img.clientHeight,
    }));
  });
};

/**
 * Check font loading status
 */
export const checkFontLoading = async (
  page: Page
): Promise<{
  fontsLoaded: boolean;
  fontCount: number;
  fontFamilies: string[];
}> => {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const fonts: FontFace[] = [];
    document.fonts.forEach((font) => fonts.push(font));
    const families = new Set<string>();
    fonts.forEach((f) => families.add(f.family));
    return {
      fontsLoaded: document.fonts.status === 'loaded',
      fontCount: fonts.length,
      fontFamilies: Array.from(families),
    };
  });
};

/**
 * Evaluate rating based on thresholds
 */
export const evaluateMetric = (
  value: number,
  thresholds: { GOOD: number; NEEDS_IMPROVEMENT: number }
): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= thresholds.GOOD) return 'good';
  if (value <= thresholds.NEEDS_IMPROVEMENT) return 'needs-improvement';
  return 'poor';
};

/**
 * Format metric value for logging
 */
export const formatMetric = (
  name: string,
  value: number,
  unit: string,
  rating: 'good' | 'needs-improvement' | 'poor'
): string => {
  const ratingEmoji =
    rating === 'good' ? '[PASS]' : rating === 'needs-improvement' ? '[WARN]' : '[FAIL]';
  return `${ratingEmoji} ${name}: ${value.toFixed(2)}${unit} (${rating})`;
};
