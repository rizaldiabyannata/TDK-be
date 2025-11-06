# Testing Guide

This document provides information about the testing setup and how to run tests for the TDK Backend project.

## 🧪 Test Structure

```
test/
├── setup.js                    # Jest setup configuration
├── global-setup.js            # Global test setup
├── global-teardown.js         # Global test cleanup
├── user-service.test.js       # User authentication tests
├── blog-model.test.js         # Blog model and controller tests
├── portfolio-model.test.js    # Portfolio model and controller tests
├── staff-organization-test.js # Staff organizational structure tests
├── service-contact.test.js    # Service and contact form tests
├── utilities.test.js          # Utility functions tests
├── middleware.test.js         # Middleware tests
├── validators.test.js         # Validation tests
└── smoke-test.js             # Basic smoke tests
```

## 🚀 Running Tests

### Run All Tests

```bash
npm test
# or
bun test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Smoke Tests Only

```bash
npm run test:smoke
```

## 📊 Test Coverage

The project aims for the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Coverage reports are generated in the `coverage/` directory.

## 🛠️ Test Categories

### 1. Unit Tests

- **Models**: Test data validation, schema constraints, and model methods
- **Services**: Test business logic and data operations
- **Utilities**: Test helper functions and external service integrations
- **Validators**: Test input validation rules
- **Middleware**: Test request processing middleware

### 2. Integration Tests

- **Controllers**: Test API endpoints and request/response handling
- **Routes**: Test route configuration and middleware chains
- **Database Operations**: Test complex queries and relationships

### 3. End-to-End Tests

- **API Workflows**: Test complete user journeys
- **Authentication Flows**: Test login, logout, and protected routes

## 🧩 Test Utilities

### Global Test Helpers

```javascript
// Create mock request/response objects
const mockReq = testUtils.createMockReq({
  body: { name: "Test" },
  user: { id: "user123" },
});

const mockRes = testUtils.createMockRes();
const mockNext = testUtils.createMockNext();

// Wait for async operations
await testUtils.wait(100);
```

### Mocking External Services

```javascript
// Mock Redis client
jest.mock("../config/redisConfig.js");

// Mock image processing
jest.mock("../services/imageService.js");

// Mock MinIO operations
jest.mock("../services/minioService.js");
```

## 📝 Writing Tests

### Test File Naming Convention

- Unit tests: `*.test.js`
- Integration tests: `*.integration.test.js`
- E2E tests: `*.e2e.test.js`

### Test Structure Pattern

```javascript
describe("Component Name", () => {
  beforeAll(async () => {
    // One-time setup (database connection, etc.)
  });

  afterAll(async () => {
    // One-time cleanup
  });

  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe("Method or Feature", () => {
    test("should do something specific", async () => {
      // Arrange
      const input = "test input";

      // Act
      const result = await someFunction(input);

      // Assert
      expect(result).toBe("expected output");
    });
  });
});
```

### Common Test Patterns

#### Testing Models

```javascript
test("should create valid model instance", async () => {
  const data = { name: "Test", email: "test@example.com" };
  const instance = new Model(data);

  await expect(instance.save()).resolves.toBeDefined();
});

test("should validate required fields", async () => {
  const data = {
    /* missing required fields */
  };
  const instance = new Model(data);

  await expect(instance.save()).rejects.toThrow();
});
```

#### Testing Controllers

```javascript
test("should return 200 for valid request", async () => {
  const mockReq = testUtils.createMockReq({
    body: { name: "Test" },
  });
  const mockRes = testUtils.createMockRes();
  const mockNext = testUtils.createMockNext();

  await controller.createItem(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({ success: true })
  );
});
```

#### Testing Services

```javascript
test("should perform business logic correctly", async () => {
  const input = { data: "test" };
  const expectedOutput = { result: "processed" };

  const result = await service.processData(input);

  expect(result).toEqual(expectedOutput);
});
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

- Uses ESM modules
- Node.js test environment
- Coverage collection from source files
- Automatic mock clearing
- 10-second timeout for async tests

### Environment Variables for Testing

```env
NODE_ENV=test
BUN_ENV=test
MONGO_URI=mongodb://localhost:27017/tdk-test
REDIS_ENABLED=false
MINIO_BUCKET=tdk-test-bucket
```

## 🚨 Common Issues & Solutions

### Database Connection Issues

```javascript
// Ensure proper cleanup
afterAll(async () => {
  await mongoose.connection.close();
});
```

### Async Test Timeouts

```javascript
// Increase timeout for slow operations
test("slow operation", async () => {
  // ... test code
}, 15000);
```

### Mocking Issues

```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 📈 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Arrange-Act-Assert**: Follow the AAA pattern
4. **Mock External Dependencies**: Avoid testing external services
5. **Test Edge Cases**: Include error conditions and edge cases
6. **Keep Tests Fast**: Optimize for quick feedback
7. **Use Appropriate Matchers**: Choose the right Jest matchers

## 🔍 Debugging Tests

### Run Specific Test

```bash
npm test -- user-service.test.js
```

### Run Specific Test Case

```bash
npm test -- -t "should create user with required fields"
```

### Debug Mode

```bash
npm test -- --inspect-brk
```

### Verbose Output

```bash
npm test -- --verbose
```

## 📊 Coverage Analysis

After running tests with coverage, check the `coverage/lcov-report/index.html` file for detailed coverage information.

Key areas to focus on:

- **Models**: Schema validation and methods
- **Services**: Business logic and data operations
- **Controllers**: Request/response handling
- **Validators**: Input validation rules
- **Middleware**: Request processing logic

## 🎯 Continuous Integration

Tests are designed to run in CI/CD pipelines. Ensure all tests pass before merging code changes.

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Generate Coverage Report
  run: npm run test:coverage
```

---

## 📞 Support

For questions about testing or to report test failures, please check:

1. Test error messages and stack traces
2. Coverage reports for uncovered code
3. Existing test patterns in the codebase
4. Jest documentation for advanced features
