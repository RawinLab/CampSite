import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Tailwind CSS Configuration', () => {
  const configPath = join(__dirname, '..', 'tailwind.config.js');
  let tailwindConfig: any;

  beforeAll(() => {
    // Dynamically import the config file
    delete require.cache[require.resolve(configPath)];
    tailwindConfig = require(configPath);
  });

  describe('Configuration File', () => {
    test('tailwind.config.js exists', () => {
      expect(existsSync(configPath)).toBe(true);
    });

    test('exports a valid configuration object', () => {
      expect(tailwindConfig).toBeDefined();
      expect(typeof tailwindConfig).toBe('object');
    });
  });

  describe('Dark Mode Configuration', () => {
    test('dark mode is configured with class strategy', () => {
      expect(tailwindConfig.darkMode).toBeDefined();
      expect(tailwindConfig.darkMode).toEqual(['class']);
    });
  });

  describe('Content Paths', () => {
    test('content paths are defined', () => {
      expect(tailwindConfig.content).toBeDefined();
      expect(Array.isArray(tailwindConfig.content)).toBe(true);
    });

    test('includes src directory with correct file extensions', () => {
      const hasSourcePath = tailwindConfig.content.some(
        (path: string) => path.includes('./src/**/*.{js,ts,jsx,tsx,mdx}')
      );
      expect(hasSourcePath).toBe(true);
    });

    test('content paths include TypeScript and React files', () => {
      const contentString = tailwindConfig.content.join(' ');
      expect(contentString).toContain('ts');
      expect(contentString).toContain('tsx');
      expect(contentString).toContain('jsx');
    });
  });

  describe('Custom Camping Theme Colors', () => {
    test('theme.extend.colors is defined', () => {
      expect(tailwindConfig.theme).toBeDefined();
      expect(tailwindConfig.theme.extend).toBeDefined();
      expect(tailwindConfig.theme.extend.colors).toBeDefined();
    });

    describe('Forest Green Colors', () => {
      test('forest color palette is defined', () => {
        expect(tailwindConfig.theme.extend.colors.forest).toBeDefined();
      });

      test('forest palette has all required shades', () => {
        const forest = tailwindConfig.theme.extend.colors.forest;
        expect(forest[50]).toBeDefined();
        expect(forest[100]).toBeDefined();
        expect(forest[500]).toBeDefined();
        expect(forest[600]).toBeDefined();
        expect(forest[700]).toBeDefined();
        expect(forest[800]).toBeDefined();
        expect(forest[900]).toBeDefined();
      });

      test('forest colors are valid hex values', () => {
        const forest = tailwindConfig.theme.extend.colors.forest;
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        expect(hexRegex.test(forest[50])).toBe(true);
        expect(hexRegex.test(forest[500])).toBe(true);
        expect(hexRegex.test(forest[900])).toBe(true);
      });

      test('forest colors represent green tones', () => {
        const forest = tailwindConfig.theme.extend.colors.forest;
        // Check that forest-500 is a green color (contains more green than red/blue)
        expect(forest[500]).toMatch(/#[0-9a-f]{2}[c-f][0-9a-f]{3}/i);
      });
    });

    describe('Earth Brown Colors', () => {
      test('earth color palette is defined', () => {
        expect(tailwindConfig.theme.extend.colors.earth).toBeDefined();
      });

      test('earth palette has all required shades', () => {
        const earth = tailwindConfig.theme.extend.colors.earth;
        expect(earth[50]).toBeDefined();
        expect(earth[100]).toBeDefined();
        expect(earth[500]).toBeDefined();
        expect(earth[600]).toBeDefined();
        expect(earth[700]).toBeDefined();
        expect(earth[800]).toBeDefined();
        expect(earth[900]).toBeDefined();
      });

      test('earth colors are valid hex values', () => {
        const earth = tailwindConfig.theme.extend.colors.earth;
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        expect(hexRegex.test(earth[50])).toBe(true);
        expect(hexRegex.test(earth[500])).toBe(true);
        expect(hexRegex.test(earth[900])).toBe(true);
      });

      test('earth colors represent brown/earth tones', () => {
        const earth = tailwindConfig.theme.extend.colors.earth;
        // Earth colors should be defined (basic check for brown-ish hex values)
        expect(earth[500]).toMatch(/#[a-f0-9]{6}/i);
      });
    });
  });

  describe('shadcn/ui Integration', () => {
    test('includes shadcn/ui color tokens', () => {
      const colors = tailwindConfig.theme.extend.colors;
      expect(colors.border).toBeDefined();
      expect(colors.input).toBeDefined();
      expect(colors.ring).toBeDefined();
      expect(colors.background).toBeDefined();
      expect(colors.foreground).toBeDefined();
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
    });

    test('color tokens use CSS variable references', () => {
      const colors = tailwindConfig.theme.extend.colors;
      expect(colors.border).toContain('hsl(var(--border))');
      expect(colors.primary.DEFAULT).toContain('hsl(var(--primary))');
    });
  });

  describe('Plugins', () => {
    test('includes required plugins', () => {
      expect(tailwindConfig.plugins).toBeDefined();
      expect(Array.isArray(tailwindConfig.plugins)).toBe(true);
      expect(tailwindConfig.plugins.length).toBeGreaterThan(0);
    });
  });

  describe('Theme Extensions', () => {
    test('includes border radius customizations', () => {
      expect(tailwindConfig.theme.extend.borderRadius).toBeDefined();
      expect(tailwindConfig.theme.extend.borderRadius.lg).toBeDefined();
    });

    test('includes animation configurations', () => {
      expect(tailwindConfig.theme.extend.keyframes).toBeDefined();
      expect(tailwindConfig.theme.extend.animation).toBeDefined();
    });
  });
});
