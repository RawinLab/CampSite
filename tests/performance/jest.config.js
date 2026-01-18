/**
 * Jest configuration for performance tests
 *
 * Note: The primary test runner for these performance tests is Playwright.
 * This Jest config is provided for any utility tests or mock-based tests
 * that don't require a real browser.
 */

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'performance',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.jest.test.ts',
    '<rootDir>/**/*.unit.test.ts',
  ],

  // Ignore Playwright tests (run with playwright test)
  testPathIgnorePatterns: [
    '/node_modules/',
    'lighthouse-.*\\.test\\.ts$',
  ],

  // Transform TypeScript
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration
  collectCoverageFrom: [
    '<rootDir>/**/*.ts',
    '!<rootDir>/**/*.test.ts',
    '!<rootDir>/playwright.config.ts',
  ],

  // Timeout for performance-related tests
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: [],

  // Verbose output
  verbose: true,
};
