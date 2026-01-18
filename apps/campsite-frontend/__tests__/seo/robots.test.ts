/**
 * Unit Tests for Robots.txt Configuration
 * Tests robots.ts functionality including rules, user agents, and sitemap configuration
 */

import type { MetadataRoute } from 'next';
import robots from '../../src/app/robots';

// Mock the SEO utils
jest.mock('../../src/lib/seo/utils', () => ({
  SITE_CONFIG: {
    domain: 'https://campingthailand.com',
  },
}));

describe('Robots.txt Configuration', () => {
  let result: MetadataRoute.Robots;

  beforeAll(() => {
    result = robots();
  });

  describe('Structure', () => {
    it('returns correct rules structure', () => {
      expect(result).toHaveProperty('rules');
      expect(Array.isArray(result.rules)).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);
    });

    it('has sitemap URL', () => {
      expect(result).toHaveProperty('sitemap');
      expect(result.sitemap).toBe('https://campingthailand.com/sitemap.xml');
    });

    it('has host configuration', () => {
      expect(result).toHaveProperty('host');
      expect(result.host).toBe('https://campingthailand.com');
    });
  });

  describe('Default User Agent Rules', () => {
    let defaultRule: MetadataRoute.Robots['rules'][0];

    beforeAll(() => {
      defaultRule = result.rules.find(
        (rule) =>
          typeof rule.userAgent === 'string' && rule.userAgent === '*'
      ) as MetadataRoute.Robots['rules'][0];
    });

    it('has wildcard user agent rule', () => {
      expect(defaultRule).toBeDefined();
      expect(defaultRule.userAgent).toBe('*');
    });

    it('allows root path', () => {
      expect(defaultRule.allow).toBe('/');
    });

    it('disallows /api/ path', () => {
      expect(defaultRule.disallow).toContain('/api/');
    });

    it('disallows /admin/ path', () => {
      expect(defaultRule.disallow).toContain('/admin/');
    });

    it('disallows /dashboard/ path', () => {
      expect(defaultRule.disallow).toContain('/dashboard/');
    });

    it('disallows auth callback and reset password', () => {
      expect(defaultRule.disallow).toContain('/auth/callback');
      expect(defaultRule.disallow).toContain('/auth/reset-password');
    });

    it('disallows internal Next.js paths', () => {
      expect(defaultRule.disallow).toContain('/_next/');
    });

    it('disallows private paths', () => {
      expect(defaultRule.disallow).toContain('/private/');
    });
  });

  describe('Googlebot Specific Rules', () => {
    let googlebotRule: MetadataRoute.Robots['rules'][0];

    beforeAll(() => {
      googlebotRule = result.rules.find(
        (rule) =>
          typeof rule.userAgent === 'string' && rule.userAgent === 'Googlebot'
      ) as MetadataRoute.Robots['rules'][0];
    });

    it('has Googlebot specific rule', () => {
      expect(googlebotRule).toBeDefined();
      expect(googlebotRule.userAgent).toBe('Googlebot');
    });

    it('allows root path for Googlebot', () => {
      expect(googlebotRule.allow).toBe('/');
    });

    it('disallows /api/ for Googlebot', () => {
      expect(googlebotRule.disallow).toContain('/api/');
    });

    it('disallows /admin/ for Googlebot', () => {
      expect(googlebotRule.disallow).toContain('/admin/');
    });

    it('disallows /dashboard/ for Googlebot', () => {
      expect(googlebotRule.disallow).toContain('/dashboard/');
    });

    it('disallows auth paths for Googlebot', () => {
      expect(googlebotRule.disallow).toContain('/auth/callback');
      expect(googlebotRule.disallow).toContain('/auth/reset-password');
    });

    it('does not block Next.js internal paths for Googlebot', () => {
      // Googlebot rule should allow crawling of public assets
      expect(googlebotRule.disallow).not.toContain('/_next/');
    });
  });

  describe('Bad Bot Blocking', () => {
    it('blocks AhrefsBot', () => {
      const ahrefsBotRule = result.rules.find(
        (rule) =>
          typeof rule.userAgent === 'string' && rule.userAgent === 'AhrefsBot'
      );

      expect(ahrefsBotRule).toBeDefined();
      expect(ahrefsBotRule?.userAgent).toBe('AhrefsBot');
      expect(ahrefsBotRule?.disallow).toBe('/');
    });

    it('blocks MJ12bot', () => {
      const mj12Rule = result.rules.find(
        (rule) =>
          typeof rule.userAgent === 'string' && rule.userAgent === 'MJ12bot'
      );

      expect(mj12Rule).toBeDefined();
      expect(mj12Rule?.userAgent).toBe('MJ12bot');
      expect(mj12Rule?.disallow).toBe('/');
    });

    it('blocks SemrushBot', () => {
      const semrushRule = result.rules.find(
        (rule) =>
          typeof rule.userAgent === 'string' && rule.userAgent === 'SemrushBot'
      );

      expect(semrushRule).toBeDefined();
      expect(semrushRule?.userAgent).toBe('SemrushBot');
      expect(semrushRule?.disallow).toBe('/');
    });

    it('has three specific bad bot rules', () => {
      const badBotRules = result.rules.filter(
        (rule) =>
          typeof rule.userAgent === 'string' &&
          ['AhrefsBot', 'MJ12bot', 'SemrushBot'].includes(rule.userAgent)
      );

      expect(badBotRules.length).toBe(3);
    });
  });

  describe('Rules Count and Order', () => {
    it('has correct number of rules', () => {
      // Should have: wildcard (*), Googlebot, and 3 bad bots = 5 total
      expect(result.rules.length).toBe(5);
    });

    it('has wildcard rule first', () => {
      expect(result.rules[0].userAgent).toBe('*');
    });

    it('has Googlebot rule second', () => {
      expect(result.rules[1].userAgent).toBe('Googlebot');
    });

    it('has bad bot rules after main rules', () => {
      const badBotUserAgents = ['AhrefsBot', 'MJ12bot', 'SemrushBot'];
      const lastThreeRules = result.rules.slice(-3);

      lastThreeRules.forEach((rule) => {
        expect(badBotUserAgents).toContain(rule.userAgent);
        expect(rule.disallow).toBe('/');
      });
    });
  });

  describe('Security and Privacy', () => {
    it('blocks access to admin areas', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/admin/');
    });

    it('blocks access to API endpoints', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/api/');
    });

    it('blocks access to user dashboards', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/dashboard/');
    });

    it('blocks access to authentication callbacks', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/auth/callback');
    });

    it('blocks access to password reset pages', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/auth/reset-password');
    });

    it('blocks access to private directories', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.disallow).toContain('/private/');
    });
  });

  describe('SEO Best Practices', () => {
    it('allows crawling of public pages', () => {
      const wildcardRule = result.rules[0];
      expect(wildcardRule.allow).toBe('/');
    });

    it('provides sitemap for search engines', () => {
      expect(result.sitemap).toBeDefined();
      expect(result.sitemap).toContain('sitemap.xml');
    });

    it('includes host directive', () => {
      expect(result.host).toBeDefined();
      expect(result.host).toBe('https://campingthailand.com');
    });

    it('blocks known SEO spam bots', () => {
      const spamBots = ['AhrefsBot', 'MJ12bot', 'SemrushBot'];
      const blockedBots = result.rules
        .filter((rule) => rule.disallow === '/')
        .map((rule) => rule.userAgent);

      spamBots.forEach((bot) => {
        expect(blockedBots).toContain(bot);
      });
    });
  });

  describe('Type Safety', () => {
    it('returns valid MetadataRoute.Robots type', () => {
      expect(result).toHaveProperty('rules');
      expect(result).toHaveProperty('sitemap');
      expect(result).toHaveProperty('host');
    });

    it('has valid rule structure', () => {
      result.rules.forEach((rule) => {
        expect(rule).toHaveProperty('userAgent');
        expect(typeof rule.userAgent === 'string' || Array.isArray(rule.userAgent)).toBe(true);
      });
    });

    it('has valid disallow values', () => {
      result.rules.forEach((rule) => {
        if (rule.disallow) {
          const isValid =
            typeof rule.disallow === 'string' || Array.isArray(rule.disallow);
          expect(isValid).toBe(true);
        }
      });
    });

    it('has valid allow values', () => {
      result.rules.forEach((rule) => {
        if (rule.allow) {
          const isValid =
            typeof rule.allow === 'string' || Array.isArray(rule.allow);
          expect(isValid).toBe(true);
        }
      });
    });
  });
});
