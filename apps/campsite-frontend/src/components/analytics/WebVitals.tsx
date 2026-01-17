'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/lib/analytics/web-vitals';

/**
 * WebVitals Component
 * Tracks Core Web Vitals metrics and reports them to analytics
 */
export function WebVitals() {
  // Use Next.js built-in web vitals reporting
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });

  // Track page views on mount
  useEffect(() => {
    // Track initial page view
    if (typeof window !== 'undefined') {
      const url = window.location.pathname + window.location.search;
      trackPageView(url);
    }
  }, []);

  return null;
}

/**
 * Track page view event
 */
function trackPageView(url: string) {
  // Send to analytics (placeholder for actual implementation)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page view:', url);
  }

  // Future: Send to Google Analytics, Mixpanel, etc.
  // Example with GA4:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', 'page_view', { page_path: url });
  // }
}

export default WebVitals;
