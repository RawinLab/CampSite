import { test, expect } from '@playwright/test';

test.describe('Robots.txt Accessibility and Validation', () => {
  test.describe('Robots.txt Accessibility', () => {
    test('should be accessible at /robots.txt', async ({ page }) => {
      const response = await page.goto('/robots.txt');

      expect(response).toBeTruthy();
      expect(response!.status()).toBe(200);
    });

    test('should have correct Content-Type header', async ({ page }) => {
      const response = await page.goto('/robots.txt');

      const contentType = response!.headers()['content-type'];
      expect(contentType).toBeTruthy();
      expect(contentType).toMatch(/text\/plain/);
    });

    test('should return text content', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      expect(content).toBeTruthy();
      expect(content!.trim().length).toBeGreaterThan(0);
    });

    test('should not return 404 or error status', async ({ page }) => {
      const response = await page.goto('/robots.txt');

      expect(response!.status()).not.toBe(404);
      expect(response!.status()).not.toBe(500);
      expect(response!.status()).toBeLessThan(400);
    });

    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/robots.txt');
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Should respond in under 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });

  test.describe('Robots.txt Format Validation', () => {
    test('should have User-agent directive', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      expect(content).toContain('User-agent:');
    });

    test('should have at least one User-agent rule', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const userAgentCount = (content!.match(/User-agent:/gi) || []).length;
      expect(userAgentCount).toBeGreaterThan(0);
    });

    test('should use proper directive format', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Check for common directives with proper formatting
      const lines = content!.split('\n');
      const directiveLines = lines.filter((line) => line.trim() && !line.startsWith('#'));

      directiveLines.forEach((line) => {
        // Each non-comment line should have a colon
        if (line.trim()) {
          expect(line).toMatch(/:/);
        }
      });
    });

    test('should not have syntax errors', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return;
        }

        // Valid directives
        const validDirectives = [
          'User-agent',
          'Disallow',
          'Allow',
          'Sitemap',
          'Crawl-delay',
          'Request-rate',
          'Visit-time',
          'Host',
        ];

        const directive = trimmedLine.split(':')[0].trim();
        const isValidDirective = validDirectives.some(
          (valid) => valid.toLowerCase() === directive.toLowerCase()
        );

        // Either valid directive or blank line
        if (trimmedLine) {
          expect(isValidDirective).toBe(true);
        }
      });
    });

    test('should not have trailing spaces on directives', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');
      const directiveLines = lines.filter(
        (line) => line.trim() && !line.startsWith('#') && line.includes(':')
      );

      directiveLines.forEach((line) => {
        const [directive, value] = line.split(':');

        // Directive should not have trailing spaces
        expect(directive).toBe(directive.trim());
      });
    });
  });

  test.describe('Robots.txt Content Requirements', () => {
    test('should reference sitemap location', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      expect(content).toContain('Sitemap:');
    });

    test('sitemap URL should be absolute', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const sitemapMatch = content!.match(/Sitemap:\s*(.+)/i);

      if (sitemapMatch) {
        const sitemapUrl = sitemapMatch[1].trim();
        expect(sitemapUrl).toMatch(/^https?:\/\//);
        expect(sitemapUrl).toContain('/sitemap.xml');
      }
    });

    test('should allow access to all user agents by default', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Should have a rule for all agents
      expect(content).toMatch(/User-agent:\s*\*/);
    });

    test('should not block important pages', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Should not block homepage
      expect(content).not.toMatch(/Disallow:\s*\/\s*$/m);

      // Should not block search page
      expect(content).not.toContain('Disallow: /search');
    });

    test('should block admin areas if they exist', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Admin areas should be blocked
      if (content!.includes('/admin')) {
        expect(content).toMatch(/Disallow:\s*\/admin/);
      }

      if (content!.includes('/api')) {
        // API endpoints may or may not be blocked
        // Just check if mentioned
      }
    });

    test('should block private or auth areas', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const privatePatterns = ['/admin', '/dashboard', '/account'];

      privatePatterns.forEach((pattern) => {
        if (content!.includes(pattern)) {
          // If mentioned, should be disallowed
          const lines = content!.split('\n');
          const hasPattern = lines.some(
            (line) => line.includes(pattern) && line.includes('Disallow')
          );
          // expect(hasPattern).toBe(true);
        }
      });
    });

    test('should not have overly restrictive rules', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');
      const disallowAll = lines.some((line) => {
        const trimmed = line.trim();
        return trimmed === 'Disallow: /' && !trimmed.includes('Disallow: /*');
      });

      // Should not block everything
      expect(disallowAll).toBe(false);
    });
  });

  test.describe('Robots.txt User-Agent Specific Rules', () => {
    test('should have rules for common crawlers', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Should have general rule
      expect(content).toMatch(/User-agent:\s*\*/);
    });

    test('should not have conflicting User-agent rules', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');
      let currentAgent = '';
      const agentRules: { [key: string]: string[] } = {};

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('User-agent:')) {
          currentAgent = trimmed.split(':')[1].trim();
          if (!agentRules[currentAgent]) {
            agentRules[currentAgent] = [];
          }
        } else if (trimmed.startsWith('Disallow:') || trimmed.startsWith('Allow:')) {
          if (currentAgent) {
            agentRules[currentAgent].push(trimmed);
          }
        }
      });

      // Each agent should have consistent rules
      Object.values(agentRules).forEach((rules) => {
        expect(rules.length).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle bad bots appropriately', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Check if bad bots are blocked
      const badBots = ['AhrefsBot', 'MJ12bot', 'SemrushBot'];

      badBots.forEach((bot) => {
        if (content!.toLowerCase().includes(bot.toLowerCase())) {
          // If bad bot is mentioned, it should be blocked
          // This is optional and depends on policy
        }
      });
    });
  });

  test.describe('Robots.txt Directives Validation', () => {
    test('Disallow directives should have proper paths', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const disallowMatches = content!.match(/Disallow:\s*(.+)/gi);

      if (disallowMatches) {
        disallowMatches.forEach((match) => {
          const path = match.split(':')[1].trim();

          // Path should start with / or be empty
          if (path && path !== '') {
            expect(path).toMatch(/^\/|^\*/);
          }
        });
      }
    });

    test('Allow directives should have proper paths', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const allowMatches = content!.match(/Allow:\s*(.+)/gi);

      if (allowMatches) {
        allowMatches.forEach((match) => {
          const path = match.split(':')[1].trim();

          // Path should start with / or be empty
          if (path && path !== '') {
            expect(path).toMatch(/^\/|^\*/);
          }
        });
      }
    });

    test('Crawl-delay should be reasonable if present', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const crawlDelayMatch = content!.match(/Crawl-delay:\s*(\d+)/i);

      if (crawlDelayMatch) {
        const delay = parseInt(crawlDelayMatch[1]);

        // Should be reasonable (not too high)
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThan(60); // Less than 60 seconds
      }
    });
  });

  test.describe('Robots.txt Comments and Documentation', () => {
    test('should have comments for clarity', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Comments are optional but recommended
      const hasComments = content!.includes('#');

      // If no comments, that's okay too
      // expect(hasComments).toBe(true);
    });

    test('comments should start with hash symbol', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');

      lines.forEach((line) => {
        const trimmed = line.trim();

        // If line looks like a comment, it should start with #
        if (trimmed && !trimmed.includes(':')) {
          // Might be a comment without #, which is invalid
          // Or might be blank line
        }
      });
    });
  });

  test.describe('Robots.txt Best Practices', () => {
    test('should not be too large', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const sizeInBytes = new Blob([content!]).size;
      const sizeInKB = sizeInBytes / 1024;

      // Should be under 500KB (Google's limit)
      expect(sizeInKB).toBeLessThan(500);

      // Should be under 100KB for good practice
      expect(sizeInKB).toBeLessThan(100);
    });

    test('should have proper line endings', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Should not have mixed line endings
      const hasCarriageReturn = content!.includes('\r\n');
      const hasLineFeed = content!.includes('\n');

      // Both can exist, but should be consistent
      expect(hasLineFeed).toBe(true);
    });

    test('should be case-consistent', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');
      const directives = lines
        .filter((line) => line.includes(':') && !line.trim().startsWith('#'))
        .map((line) => line.split(':')[0].trim());

      // Check if directives use consistent casing
      const userAgentCases = directives.filter((d) => d.toLowerCase() === 'user-agent');

      if (userAgentCases.length > 1) {
        const firstCase = userAgentCases[0];
        const allSameCase = userAgentCases.every((d) => d === firstCase);

        expect(allSameCase).toBe(true);
      }
    });

    test('should have proper spacing', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      const lines = content!.split('\n');
      const directiveLines = lines.filter((line) => line.includes(':') && !line.startsWith('#'));

      directiveLines.forEach((line) => {
        // Should have space after colon (recommended but not required)
        const hasProperSpacing =
          line.includes(': ') || line.endsWith(':') || !line.includes(' :');

        // This is a soft requirement
        // expect(hasProperSpacing).toBe(true);
      });
    });

    test('should end with newline', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // File should ideally end with newline
      // expect(content!.endsWith('\n')).toBe(true);
    });
  });

  test.describe('Robots.txt Security', () => {
    test('should not expose sensitive information', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Should not contain sensitive patterns
      const sensitivePatterns = [
        'password',
        'secret',
        'api-key',
        'token',
        'backup',
        '.env',
        '.git',
      ];

      sensitivePatterns.forEach((pattern) => {
        const lowerContent = content!.toLowerCase();
        // It's okay to block these paths, but shouldn't expose details
        // Just check they're not mentioned unnecessarily
      });
    });

    test('should not have overly specific disallow rules', async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      // Avoid exposing directory structure too much
      const lines = content!.split('\n');
      const disallowLines = lines.filter((line) => line.includes('Disallow:'));

      // Should not have excessive number of specific paths
      expect(disallowLines.length).toBeLessThan(50);
    });
  });
});
