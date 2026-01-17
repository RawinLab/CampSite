import { readFileSync } from 'fs';
import { join } from 'path';

describe('turbo.json configuration', () => {
  let turboConfig: any;

  beforeAll(() => {
    const turboJsonPath = join(__dirname, '..', 'turbo.json');
    const turboJsonContent = readFileSync(turboJsonPath, 'utf-8');
    turboConfig = JSON.parse(turboJsonContent);
  });

  describe('schema and structure', () => {
    it('should have valid schema reference', () => {
      expect(turboConfig.$schema).toBe('https://turbo.build/schema.json');
    });

    it('should have tasks configuration', () => {
      expect(turboConfig.tasks).toBeDefined();
      expect(typeof turboConfig.tasks).toBe('object');
    });

    it('should have globalDependencies configuration', () => {
      expect(turboConfig.globalDependencies).toBeDefined();
      expect(Array.isArray(turboConfig.globalDependencies)).toBe(true);
    });

    it('should include environment files in globalDependencies', () => {
      expect(turboConfig.globalDependencies).toContain('**/.env.*local');
    });
  });

  describe('required tasks', () => {
    it('should have build task', () => {
      expect(turboConfig.tasks.build).toBeDefined();
    });

    it('should have dev task', () => {
      expect(turboConfig.tasks.dev).toBeDefined();
    });

    it('should have lint task', () => {
      expect(turboConfig.tasks.lint).toBeDefined();
    });

    it('should have test task', () => {
      expect(turboConfig.tasks.test).toBeDefined();
    });
  });

  describe('build task configuration', () => {
    it('should have correct dependsOn configuration', () => {
      expect(turboConfig.tasks.build.dependsOn).toBeDefined();
      expect(turboConfig.tasks.build.dependsOn).toContain('^build');
    });

    it('should have outputs configuration', () => {
      expect(turboConfig.tasks.build.outputs).toBeDefined();
      expect(Array.isArray(turboConfig.tasks.build.outputs)).toBe(true);
    });

    it('should include Next.js build outputs', () => {
      expect(turboConfig.tasks.build.outputs).toContain('.next/**');
      expect(turboConfig.tasks.build.outputs).toContain('!.next/cache/**');
    });

    it('should include dist outputs for backend', () => {
      expect(turboConfig.tasks.build.outputs).toContain('dist/**');
    });

    it('should cache build by default', () => {
      // If cache is not explicitly set to false, it defaults to true
      expect(turboConfig.tasks.build.cache).not.toBe(false);
    });
  });

  describe('dev task configuration', () => {
    it('should disable caching for dev task', () => {
      expect(turboConfig.tasks.dev.cache).toBe(false);
    });

    it('should be marked as persistent', () => {
      expect(turboConfig.tasks.dev.persistent).toBe(true);
    });

    it('should not have dependsOn configuration', () => {
      // Dev tasks typically don't depend on other tasks
      expect(turboConfig.tasks.dev.dependsOn).toBeUndefined();
    });
  });

  describe('lint task configuration', () => {
    it('should depend on build completion', () => {
      expect(turboConfig.tasks.lint.dependsOn).toBeDefined();
      expect(turboConfig.tasks.lint.dependsOn).toContain('^build');
    });

    it('should cache by default', () => {
      expect(turboConfig.tasks.lint.cache).not.toBe(false);
    });
  });

  describe('test task configuration', () => {
    it('should have correct dependsOn configuration', () => {
      expect(turboConfig.tasks.test.dependsOn).toBeDefined();
    });

    it('should depend on build task', () => {
      expect(turboConfig.tasks.test.dependsOn).toContain('build');
    });

    it('should cache by default', () => {
      expect(turboConfig.tasks.test.cache).not.toBe(false);
    });
  });

  describe('caching configuration', () => {
    it('should enable caching for build task', () => {
      expect(turboConfig.tasks.build.cache).not.toBe(false);
    });

    it('should disable caching for dev task', () => {
      expect(turboConfig.tasks.dev.cache).toBe(false);
    });

    it('should enable caching for lint task', () => {
      expect(turboConfig.tasks.lint.cache).not.toBe(false);
    });

    it('should enable caching for test task', () => {
      expect(turboConfig.tasks.test.cache).not.toBe(false);
    });

    it('should disable caching for clean task if present', () => {
      if (turboConfig.tasks.clean) {
        expect(turboConfig.tasks.clean.cache).toBe(false);
      }
    });
  });

  describe('task dependencies', () => {
    it('should have valid dependency syntax', () => {
      Object.entries(turboConfig.tasks).forEach(([taskName, taskConfig]: [string, any]) => {
        if (taskConfig.dependsOn) {
          expect(Array.isArray(taskConfig.dependsOn)).toBe(true);

          taskConfig.dependsOn.forEach((dep: string) => {
            // Should be either ^taskName (workspace dependency) or taskName (same package)
            expect(typeof dep).toBe('string');
            expect(dep.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should use caret (^) prefix for workspace dependencies', () => {
      // Build should depend on workspace builds first
      expect(turboConfig.tasks.build.dependsOn).toContain('^build');

      // Lint should depend on workspace builds first
      expect(turboConfig.tasks.lint.dependsOn).toContain('^build');
    });

    it('should use no prefix for same-package dependencies', () => {
      // Test depends on build in the same package
      expect(turboConfig.tasks.test.dependsOn).toContain('build');
    });
  });

  describe('typecheck task configuration', () => {
    it('should have typecheck task', () => {
      expect(turboConfig.tasks.typecheck).toBeDefined();
    });

    it('should depend on workspace builds', () => {
      expect(turboConfig.tasks.typecheck.dependsOn).toBeDefined();
      expect(turboConfig.tasks.typecheck.dependsOn).toContain('^build');
    });
  });

  describe('clean task configuration', () => {
    it('should have clean task', () => {
      expect(turboConfig.tasks.clean).toBeDefined();
    });

    it('should disable caching for clean task', () => {
      expect(turboConfig.tasks.clean.cache).toBe(false);
    });
  });

  describe('output configuration validation', () => {
    it('should exclude cache directories from outputs', () => {
      expect(turboConfig.tasks.build.outputs).toContain('!.next/cache/**');
    });

    it('should use glob patterns for outputs', () => {
      turboConfig.tasks.build.outputs.forEach((output: string) => {
        // Outputs should contain /** or specific glob patterns
        expect(output).toMatch(/\*\*|!.*\*\*/);
      });
    });
  });

  describe('configuration completeness', () => {
    it('should have all essential monorepo tasks', () => {
      const essentialTasks = ['build', 'dev', 'lint', 'test'];
      essentialTasks.forEach(task => {
        expect(turboConfig.tasks[task]).toBeDefined();
      });
    });

    it('should not have undefined or null task configurations', () => {
      Object.entries(turboConfig.tasks).forEach(([taskName, taskConfig]) => {
        expect(taskConfig).toBeDefined();
        expect(taskConfig).not.toBeNull();
      });
    });

    it('should have valid JSON structure', () => {
      // If we got here, JSON parsing was successful
      expect(turboConfig).toBeDefined();
      expect(typeof turboConfig).toBe('object');
    });
  });
});
