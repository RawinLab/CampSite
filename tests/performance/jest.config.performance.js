/**
 * Jest configuration for Core Web Vitals performance tests
 * Uses Playwright for browser-based metrics collection
 */
module.exports = {
  displayName: 'performance',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 60000, // Performance tests may take longer
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../apps/campsite-frontend/src/$1',
  },
  verbose: true,
  // Slower tests should run in sequence to avoid resource contention
  maxWorkers: 1,
};
