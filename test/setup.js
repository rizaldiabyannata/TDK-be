// Jest setup file
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

// Set test environment
process.env.NODE_ENV = "test";
process.env.BUN_ENV = "test";

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Helper to create mock request/response objects
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    file: null,
    files: null,
    fileUrl: null,
    user: null,
    ...overrides,
  }),

  createMockRes: (overrides = {}) => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    ...overrides,
  }),

  createMockNext: () => jest.fn(),
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't fail the test suite on unhandled rejections
});
