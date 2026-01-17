/**
 * Web Vitals Analytics
 * Functions for tracking and reporting Core Web Vitals metrics
 */

// Web Vitals metric type
interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

// Metric thresholds based on Google's Core Web Vitals guidelines
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
};

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];

  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Report web vitals metric to analytics service
 */
export function reportWebVitals(metric: Metric) {
  const { name, value, id, rating } = metric;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const emoji =
      rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `[Web Vitals] ${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`
    );
  }

  // Send to analytics endpoint
  const body = JSON.stringify({
    name,
    value,
    id,
    rating,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: Date.now(),
  });

  // Use sendBeacon for reliable delivery on page unload
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    if (analyticsEndpoint) {
      navigator.sendBeacon(analyticsEndpoint, body);
    }
  }

  // Future integrations:

  // Google Analytics 4
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', name, {
  //     value: Math.round(name === 'CLS' ? value * 1000 : value),
  //     event_category: 'Web Vitals',
  //     event_label: id,
  //     non_interaction: true,
  //   });
  // }

  // Vercel Analytics
  // if (typeof window !== 'undefined' && window.va) {
  //   window.va('track', 'web-vitals', {
  //     name,
  //     value,
  //     rating,
  //   });
  // }
}

/**
 * Manual performance measurement for custom metrics
 */
export function measurePerformance(
  name: string,
  callback: () => void | Promise<void>
) {
  const start = performance.now();

  const finish = () => {
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    // Report custom metric
    reportCustomMetric(name, duration);
  };

  const result = callback();

  if (result instanceof Promise) {
    result.then(finish).catch(finish);
  } else {
    finish();
  }
}

/**
 * Report custom performance metric
 */
export function reportCustomMetric(name: string, value: number) {
  const body = JSON.stringify({
    type: 'custom',
    name,
    value,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: Date.now(),
  });

  const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (analyticsEndpoint && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(analyticsEndpoint, body);
  }
}

/**
 * Track interaction timing
 */
export function trackInteraction(interactionName: string, duration: number) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Interaction] ${interactionName}: ${duration.toFixed(2)}ms`);
  }

  reportCustomMetric(`interaction_${interactionName}`, duration);
}
