module.exports = {
  projects: [
    '<rootDir>/apps/campsite-frontend',
    '<rootDir>/apps/campsite-backend',
    '<rootDir>/packages/shared',
    {
      displayName: 'e2e-api',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/tests/e2e/api',
      testMatch: ['**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../../../apps/campsite-backend/__tests__/setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/tests/integration',
      testMatch: ['**/*.test.ts'],
    },
  ],
};
