export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  roots: ['<rootDir>/tests'],
  transform: {},
  modulePathIgnorePatterns: [
    '<rootDir>/github-repo',
    '<rootDir>/cloudflare-frontend',
    '<rootDir>/frontend',
    '<rootDir>/website',
  ],
  verbose: false,
};
