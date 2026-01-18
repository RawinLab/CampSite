/**
 * Web Vitals Analytics Tests
 * Tests for Core Web Vitals tracking and reporting functions
 */

import {
  WEB_VITALS_THRESHOLDS,
  getMetricRating,
  reportWebVitals,
  measurePerformance,
  reportCustomMetric,
  trackInteraction,
} from '@/lib/analytics/web-vitals';

// Mock metric interface
interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

describe('Web Vitals Analytics', () => {
  describe('WEB_VITALS_THRESHOLDS', () => {
    it('should have correct threshold values for LCP', () => {
      expect(WEB_VITALS_THRESHOLDS.LCP).toEqual({
        good: 2500,
        needsImprovement: 4000,
      });
    });

    it('should have correct threshold values for FID', () => {
      expect(WEB_VITALS_THRESHOLDS.FID).toEqual({
        good: 100,
        needsImprovement: 300,
      });
    });

    it('should have correct threshold values for CLS', () => {
      expect(WEB_VITALS_THRESHOLDS.CLS).toEqual({
        good: 0.1,
        needsImprovement: 0.25,
      });
    });

    it('should have correct threshold values for FCP', () => {
      expect(WEB_VITALS_THRESHOLDS.FCP).toEqual({
        good: 1800,
        needsImprovement: 3000,
      });
    });

    it('should have correct threshold values for TTFB', () => {
      expect(WEB_VITALS_THRESHOLDS.TTFB).toEqual({
        good: 800,
        needsImprovement: 1800,
      });
    });

    it('should have correct threshold values for INP', () => {
      expect(WEB_VITALS_THRESHOLDS.INP).toEqual({
        good: 200,
        needsImprovement: 500,
      });
    });
  });

  describe('getMetricRating', () => {
    it('should return "good" for values below good threshold', () => {
      expect(getMetricRating('LCP', 2000)).toBe('good');
      expect(getMetricRating('FID', 50)).toBe('good');
      expect(getMetricRating('CLS', 0.05)).toBe('good');
    });

    it('should return "good" for values equal to good threshold', () => {
      expect(getMetricRating('LCP', 2500)).toBe('good');
      expect(getMetricRating('FID', 100)).toBe('good');
      expect(getMetricRating('CLS', 0.1)).toBe('good');
    });

    it('should return "needs-improvement" for values between thresholds', () => {
      expect(getMetricRating('LCP', 3000)).toBe('needs-improvement');
      expect(getMetricRating('FID', 200)).toBe('needs-improvement');
      expect(getMetricRating('CLS', 0.15)).toBe('needs-improvement');
    });

    it('should return "needs-improvement" for values equal to needs improvement threshold', () => {
      expect(getMetricRating('LCP', 4000)).toBe('needs-improvement');
      expect(getMetricRating('FID', 300)).toBe('needs-improvement');
      expect(getMetricRating('CLS', 0.25)).toBe('needs-improvement');
    });

    it('should return "poor" for values above needs improvement threshold', () => {
      expect(getMetricRating('LCP', 5000)).toBe('poor');
      expect(getMetricRating('FID', 400)).toBe('poor');
      expect(getMetricRating('CLS', 0.3)).toBe('poor');
    });

    it('should return "good" for unknown metric names', () => {
      expect(getMetricRating('UNKNOWN', 9999)).toBe('good');
    });
  });

  describe('reportWebVitals', () => {
    let consoleLogSpy: jest.SpyInstance;
    let sendBeaconSpy: jest.SpyInstance;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      sendBeaconSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: sendBeaconSpy,
      });
      delete (window as any).location;
      (window as any).location = { pathname: '/test-page' };
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    });

    it('should log metric in development environment with good rating', () => {
      process.env.NODE_ENV = 'development';

      const metric: Metric = {
        id: 'v1-123',
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Web Vitals]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LCP')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('good')
      );
    });

    it('should log metric with warning emoji for needs-improvement', () => {
      process.env.NODE_ENV = 'development';

      const metric: Metric = {
        id: 'v1-124',
        name: 'FID',
        value: 200,
        rating: 'needs-improvement',
        delta: 200,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );
    });

    it('should log metric with error emoji for poor rating', () => {
      process.env.NODE_ENV = 'development';

      const metric: Metric = {
        id: 'v1-125',
        name: 'CLS',
        value: 0.3,
        rating: 'poor',
        delta: 0.3,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
    });

    it('should send metric to analytics endpoint when configured', () => {
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = 'https://analytics.example.com/collect';

      const metric: Metric = {
        id: 'v1-126',
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 2500,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        'https://analytics.example.com/collect',
        expect.stringContaining('"name":"LCP"')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"value":2500')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"rating":"good"')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"page":"/test-page"')
      );
    });

    it('should not send beacon when analytics endpoint is not configured', () => {
      const metric: Metric = {
        id: 'v1-127',
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      expect(sendBeaconSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp in beacon data', () => {
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = 'https://analytics.example.com/collect';
      const beforeTime = Date.now();

      const metric: Metric = {
        id: 'v1-128',
        name: 'TTFB',
        value: 700,
        rating: 'good',
        delta: 700,
        navigationType: 'navigate',
      };

      reportWebVitals(metric);

      const afterTime = Date.now();
      const sentData = JSON.parse(sendBeaconSpy.mock.calls[0][1]);

      expect(sentData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(sentData.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('measurePerformance', () => {
    let consoleLogSpy: jest.SpyInstance;
    let sendBeaconSpy: jest.SpyInstance;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      sendBeaconSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: sendBeaconSpy,
      });
      jest.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1150);
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      jest.restoreAllMocks();
    });

    it('should measure synchronous callback execution time', () => {
      process.env.NODE_ENV = 'development';

      const callback = jest.fn();
      measurePerformance('test-operation', callback);

      expect(callback).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-operation')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('150')
      );
    });

    it('should measure asynchronous callback execution time', async () => {
      process.env.NODE_ENV = 'development';
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2300);

      const asyncCallback = jest.fn().mockResolvedValue('result');
      measurePerformance('async-operation', asyncCallback);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(asyncCallback).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('async-operation')
      );
    });

    it('should handle promise rejection gracefully', async () => {
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce(3100);

      const failingCallback = jest.fn().mockRejectedValue(new Error('test error'));
      measurePerformance('failing-operation', failingCallback);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(failingCallback).toHaveBeenCalled();
    });
  });

  describe('reportCustomMetric', () => {
    let sendBeaconSpy: jest.SpyInstance;

    beforeEach(() => {
      sendBeaconSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: sendBeaconSpy,
      });
      delete (window as any).location;
      (window as any).location = { pathname: '/custom-page' };
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    });

    it('should send custom metric with correct data structure', () => {
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = 'https://analytics.example.com/collect';

      reportCustomMetric('custom-metric', 1234);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        'https://analytics.example.com/collect',
        expect.stringContaining('"type":"custom"')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"name":"custom-metric"')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"value":1234')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"page":"/custom-page"')
      );
    });

    it('should not send beacon when analytics endpoint is not configured', () => {
      reportCustomMetric('metric-name', 5678);

      expect(sendBeaconSpy).not.toHaveBeenCalled();
    });
  });

  describe('trackInteraction', () => {
    let consoleLogSpy: jest.SpyInstance;
    let sendBeaconSpy: jest.SpyInstance;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      sendBeaconSpy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: sendBeaconSpy,
      });
      delete (window as any).location;
      (window as any).location = { pathname: '/interaction-page' };
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    });

    it('should log interaction in development environment', () => {
      process.env.NODE_ENV = 'development';

      trackInteraction('button-click', 250);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Interaction]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('button-click')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('250')
      );
    });

    it('should report interaction as custom metric with prefix', () => {
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = 'https://analytics.example.com/collect';

      trackInteraction('form-submit', 350);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        'https://analytics.example.com/collect',
        expect.stringContaining('"name":"interaction_form-submit"')
      );
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"value":350')
      );
    });

    it('should format duration with two decimal places in logs', () => {
      process.env.NODE_ENV = 'development';

      trackInteraction('scroll-end', 123.456789);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('123.46')
      );
    });
  });
});
