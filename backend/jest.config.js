module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 6,
      functions: 8,
      lines: 9,
      statements: 9,
    },
  },
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};