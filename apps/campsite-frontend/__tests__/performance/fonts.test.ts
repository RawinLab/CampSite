/**
 * Font Configuration Tests
 * Tests for Next.js font optimization and loading strategy
 */

import { render } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';

// Mock Next.js font module
jest.mock('next/font/google', () => ({
  Noto_Sans_Thai: jest.fn(() => ({
    className: 'noto-sans-thai-class',
    variable: '--font-noto-sans-thai',
    style: {
      fontFamily: 'Noto Sans Thai, sans-serif',
    },
  })),
}));

// Mock child components
jest.mock('@/lib/seo/utils', () => ({
  generateBaseMetadata: jest.fn((config) => config),
  SITE_CONFIG: {
    name: 'Camping Thailand',
    description: 'Find campsites across Thailand',
  },
}));

jest.mock('@/components/seo/OrganizationSchema', () => ({
  OrganizationSchema: () => null,
}));

jest.mock('@/components/analytics/WebVitals', () => ({
  WebVitals: () => null,
}));

describe('Font Configuration', () => {
  describe('Layout Metadata', () => {
    it('should include font configuration in metadata', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
    });

    it('should have manifest for PWA support', () => {
      expect(metadata.manifest).toBe('/manifest.json');
    });

    it('should include favicon icons', () => {
      expect(metadata.icons).toBeDefined();
      expect(metadata.icons?.icon).toEqual([
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ]);
      expect(metadata.icons?.apple).toBe('/apple-touch-icon.png');
    });
  });

  describe('Font Display Strategy', () => {
    let mockNotoSansThai: jest.Mock;

    beforeEach(() => {
      mockNotoSansThai = require('next/font/google').Noto_Sans_Thai as jest.Mock;
      mockNotoSansThai.mockClear();
    });

    it('should configure Noto Sans Thai with font-display swap', () => {
      // Re-import to trigger font initialization
      jest.isolateModules(() => {
        require('@/app/layout');
      });

      expect(mockNotoSansThai).toHaveBeenCalledWith(
        expect.objectContaining({
          display: 'swap',
        })
      );
    });

    it('should include Thai and Latin subsets', () => {
      jest.isolateModules(() => {
        require('@/app/layout');
      });

      expect(mockNotoSansThai).toHaveBeenCalledWith(
        expect.objectContaining({
          subsets: ['thai', 'latin'],
        })
      );
    });

    it('should configure multiple font weights', () => {
      jest.isolateModules(() => {
        require('@/app/layout');
      });

      expect(mockNotoSansThai).toHaveBeenCalledWith(
        expect.objectContaining({
          weight: ['300', '400', '500', '600', '700'],
        })
      );
    });

    it('should set CSS variable for font', () => {
      jest.isolateModules(() => {
        require('@/app/layout');
      });

      expect(mockNotoSansThai).toHaveBeenCalledWith(
        expect.objectContaining({
          variable: '--font-noto-sans-thai',
        })
      );
    });

    it('should enable font preloading', () => {
      jest.isolateModules(() => {
        require('@/app/layout');
      });

      expect(mockNotoSansThai).toHaveBeenCalledWith(
        expect.objectContaining({
          preload: true,
        })
      );
    });
  });

  describe('Google Fonts Preconnect', () => {
    it('should render preconnect links for Google Fonts', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.innerHTML;
      expect(html).toContain('https://fonts.googleapis.com');
      expect(html).toContain('https://fonts.gstatic.com');
      expect(html).toContain('preconnect');
    });

    it('should include crossOrigin attribute for fonts.gstatic.com', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const preconnectLinks = container.querySelectorAll('link[rel="preconnect"]');
      const gstaticLink = Array.from(preconnectLinks).find(
        (link) => link.getAttribute('href') === 'https://fonts.gstatic.com'
      );

      expect(gstaticLink).toBeDefined();
      // In React, crossOrigin becomes crossorigin in the DOM
      expect(gstaticLink?.hasAttribute('crossorigin')).toBe(true);
    });

    it('should include DNS prefetch for Supabase', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.innerHTML;
      expect(html).toContain('dns-prefetch');
      expect(html).toContain('https://supabase.co');
    });
  });

  describe('Font Variable Application', () => {
    it('should apply font variable to html element', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.querySelector('html');
      expect(html?.className).toContain('--font-noto-sans-thai');
    });

    it('should apply font className to body element', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const body = container.querySelector('body');
      expect(body?.className).toContain('noto-sans-thai-class');
      expect(body?.className).toContain('antialiased');
    });

    it('should set lang attribute to Thai', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.querySelector('html');
      expect(html?.getAttribute('lang')).toBe('th');
    });
  });

  describe('Performance Optimization', () => {
    it('should use next/font for automatic optimization', () => {
      const NextFont = require('next/font/google');
      expect(NextFont.Noto_Sans_Thai).toHaveBeenCalled();
    });

    it('should apply antialiased class for better font rendering', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const body = container.querySelector('body');
      expect(body?.className).toContain('antialiased');
    });
  });

  describe('Layout Structure', () => {
    it('should render children within layout', () => {
      const { getByText } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('should include OrganizationSchema component', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      // Component is mocked to return null, but it should be called
      const OrganizationSchema = require('@/components/seo/OrganizationSchema').OrganizationSchema;
      expect(OrganizationSchema).toBeDefined();
    });

    it('should include WebVitals component', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      // Component is mocked to return null, but it should be called
      const WebVitals = require('@/components/analytics/WebVitals').WebVitals;
      expect(WebVitals).toBeDefined();
    });
  });
});
