export default {
  preset: null,
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^../utils/logger\\.js$": "<rootDir>/test/__mocks__/logger.js",
    "^../config/redisConfig\\.js$": "<rootDir>/test/__mocks__/redisConfig.js",
  },
  transformIgnorePatterns: ["node_modules/(?!(supertest)/)"],
  testMatch: ["<rootDir>/test/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
    "middleware/**/*.js",
    "utils/**/*.js",
    "validators/**/*.js",
    "config/**/*.js",
    "!**/node_modules/**",
    "!**/test/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  verbose: true,
};
