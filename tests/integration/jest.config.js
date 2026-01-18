module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../apps/campsite-backend/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/../../apps/campsite-backend/tsconfig.json',
    }],
  },
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
  testTimeout: 30000,
};
