/**
 * @fileoverview Jest configuration for the Warframe project
 * @module jest.config
 */

module.exports = {
  /**
   * Use ts-jest for TypeScript support
   */
  preset: 'ts-jest',

  /**
   * Run tests in Node.js environment
   */
  testEnvironment: 'node',

  /**
   * Root directories for test discovery
   */
  roots: ['<rootDir>'],

  /**
   * File patterns to match for tests
   */
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  /**
   * Files to ignore during testing
   */
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/app/'
  ],

  /**
   * Module file extensions
   */
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  /**
   * Transform configuration for TypeScript
   */
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },

  /**
   * Coverage configuration
   */
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/app/**',
    '!jest.config.js',
    '!**/coverage/**'
  ],

  /**
   * Coverage thresholds
   */
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  /**
   * Coverage output directory
   */
  coverageDirectory: 'coverage',

  /**
   * Coverage reporters
   */
  coverageReporters: ['text', 'lcov', 'html'],

  /**
   * Setup files after env is loaded
   */
  setupFilesAfterEnv: [],

  /**
   * Verbose output
   */
  verbose: true,

  /**
   * Clear mocks between tests
   */
  clearMocks: true,

  /**
   * Module path aliases (matching tsconfig paths)
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@interfaces/(.*)$': '<rootDir>/interfaces/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    // The app's relic-value composable imports `unref` from 'vue'; stub it so the
    // pure valuation logic is unit-testable under the backend's Node setup.
    '^vue$': '<rootDir>/test-helpers/vue-stub.js',
    // The shared marketFormat module pulls `useNuxtApp` from Nuxt's virtual
    // `#imports`; stub it so the endo/relic composables load under jest.
    '^#imports$': '<rootDir>/test-helpers/imports-stub.js'
  },

  /**
   * Global timeout for tests (10 seconds)
   */
  testTimeout: 10000,

  /**
   * Force exit after tests complete
   */
  forceExit: true,

  /**
   * Detect open handles
   */
  detectOpenHandles: true
};
