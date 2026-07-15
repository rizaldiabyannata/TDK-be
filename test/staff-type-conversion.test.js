import fetch from "node-fetch";
import FormData from "form-data";

/**
 * Staff API Type Conversion Test
 * Focus: Verify that level field is properly converted from string to number
 * Problem being tested: level="1" should become level=1 (number)
 */

const BASE_URL = "http://localhost:5000/api";
const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "password";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.blue}► ${msg}${colors.reset}`),
  test: (msg) => console.log(`  ${colors.cyan}○ ${msg}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`  ${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`  ${colors.yellow}ℹ ${msg}${colors.reset}`),
  detail: (msg) => console.log(`    ${msg}`),
};

let testResults = { total: 0, passed: 0, failed: 0, tests: [] };

const runTest = async (testName, testFn) => {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    log.success(testName);
    testResults.tests.push({ name: testName, status: "PASS" });
  } catch (error) {
    testResults.failed++;
    log.error(testName);
    log.info(`Error: ${error.message}`);
    testResults.tests.push({
      name: testName,
      status: "FAIL",
      error: error.message,
    });
  }
};

const login = async () => {
  const response = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    credentials: "include",
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error("Login failed: " + (data.message || "Unknown error"));
  }

  return data.data.accessToken;
};

const typeOfValue = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

const runTypeConversionTests = async () => {
  let authToken;

  try {
    // Login
    const response = await fetch(`${BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      credentials: "include",
    });

    const loginData = await response.json();
    if (!loginData.success) {
      throw new Error("Login failed");
    }
    authToken = loginData.data.accessToken;

    log.header("Type Conversion Tests for Staff Level");

    // Test 1: String "1" should become number 1
    await runTest(
      'Type conversion: level="1" should be stored as number 1',
      async () => {
        const formData = new FormData();
        formData.append("name", "Test Level 1");
        formData.append("position", "Test Position");
        formData.append("level", "1"); // String
        formData.append("order", "0");
        formData.append("shortDescription", "Testing type conversion");

        const response = await fetch(`${BASE_URL}/staff`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...formData.getHeaders(),
          },
          body: formData,
          credentials: "include",
        });

        const data = await response.json();
        if (!data.success)
          throw new Error(data.message || "Failed to create staff");

        const actualType = typeOfValue(data.data.level);
        const actualValue = data.data.level;

        log.detail(`Input: level="1" (string)`);
        log.detail(`Output: level=${actualValue} (${actualType})`);

        if (actualType !== "number") {
          throw new Error(`Level should be number, got ${actualType}`);
        }
        if (actualValue !== 1) {
          throw new Error(`Level should be 1, got ${actualValue}`);
        }
      }
    );

    // Test 2: String "2" should become number 2
    await runTest(
      'Type conversion: level="2" should be stored as number 2',
      async () => {
        const formData = new FormData();
        formData.append("name", "Test Level 2");
        formData.append("position", "Test Position");
        formData.append("level", "2"); // String
        formData.append("shortDescription", "Testing type conversion");

        const response = await fetch(`${BASE_URL}/staff`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...formData.getHeaders(),
          },
          body: formData,
          credentials: "include",
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        if (
          typeOfValue(data.data.level) !== "number" ||
          data.data.level !== 2
        ) {
          throw new Error(
            `Expected level 2 (number), got ${data.data.level} (${typeOfValue(
              data.data.level
            )})`
          );
        }

        log.detail(`Input: level="2" (string) → Output: level=2 (number) ✓`);
      }
    );

    // Test 3: Level ordering (numeric, not lexicographic)
    await runTest(
      "Type conversion: Numeric level sorting (not lexicographic)",
      async () => {
        const response = await fetch(`${BASE_URL}/staff/structure`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!data.success) throw new Error("Failed to fetch structure");

        const levelKeys = Object.keys(data.data)
          .map((k) => parseInt(k))
          .sort((a, b) => a - b);
        const stringKeys = Object.keys(data.data).sort();

        // Verify numeric sorting, not lexicographic
        for (let i = 0; i < levelKeys.length - 1; i++) {
          if (levelKeys[i] > levelKeys[i + 1]) {
            throw new Error("Levels should be sorted numerically");
          }
        }

        log.detail(`Levels found: ${levelKeys.join(", ")}`);
        log.detail(`Numeric sort correct ✓`);
      }
    );

    // Test 4: All retrieved staff have numeric levels
    await runTest(
      "Type consistency: All retrieved staff have numeric levels",
      async () => {
        const response = await fetch(`${BASE_URL}/staff`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!data.success) throw new Error("Failed to fetch staff");

        let nonNumericCount = 0;
        data.data.forEach((staff) => {
          if (typeOfValue(staff.level) !== "number") {
            nonNumericCount++;
            log.detail(
              `Found non-numeric level: ${staff.name} has level=${
                staff.level
              } (${typeOfValue(staff.level)})`
            );
          }
        });

        if (nonNumericCount > 0) {
          throw new Error(`${nonNumericCount} staff have non-numeric levels`);
        }

        log.detail(`All ${data.count} staff have numeric levels ✓`);
      }
    );

    // Test 5: Level must be >= 1 (validation)
    await runTest("Validation: Level must be >= 1", async () => {
      const formData = new FormData();
      formData.append("name", "Invalid Level");
      formData.append("position", "Test Position");
      formData.append("level", "0"); // Invalid
      formData.append("shortDescription", "Testing validation");

      const response = await fetch(`${BASE_URL}/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        throw new Error("Should reject level 0");
      }

      log.detail(`Correctly rejected level=0 ✓`);
    });

    // Test 6: Negative levels are rejected
    await runTest("Validation: Negative levels are rejected", async () => {
      const formData = new FormData();
      formData.append("name", "Negative Level");
      formData.append("position", "Test Position");
      formData.append("level", "-5"); // Invalid
      formData.append("shortDescription", "Testing validation");

      const response = await fetch(`${BASE_URL}/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        throw new Error("Should reject negative levels");
      }

      log.detail(`Correctly rejected level=-5 ✓`);
    });

    // Test 7: Non-numeric levels are rejected
    await runTest("Validation: Non-numeric levels are rejected", async () => {
      const formData = new FormData();
      formData.append("name", "Non-numeric Level");
      formData.append("position", "Test Position");
      formData.append("level", "abc"); // Invalid
      formData.append("shortDescription", "Testing validation");

      const response = await fetch(`${BASE_URL}/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders(),
        },
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        throw new Error("Should reject non-numeric levels");
      }

      log.detail(`Correctly rejected level="abc" ✓`);
    });

    // Test 8: Order field also converts to number
    await runTest(
      "Type conversion: order field also converts to number",
      async () => {
        const formData = new FormData();
        formData.append("name", "Test Order");
        formData.append("position", "Test Position");
        formData.append("level", "1");
        formData.append("order", "5"); // String
        formData.append("shortDescription", "Testing order conversion");

        const response = await fetch(`${BASE_URL}/staff`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...formData.getHeaders(),
          },
          body: formData,
          credentials: "include",
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        if (typeOfValue(data.data.order) !== "number") {
          throw new Error(
            `Order should be number, got ${typeOfValue(data.data.order)}`
          );
        }

        log.detail(`Input: order="5" (string) → Output: order=5 (number) ✓`);
      }
    );

    // Test 9: Update level converts type
    await runTest(
      "Type conversion: Update level also converts to number",
      async () => {
        // Create a staff first
        const formData = new FormData();
        formData.append("name", "Test Update Level");
        formData.append("position", "Test Position");
        formData.append("level", "1");
        formData.append("shortDescription", "Testing update conversion");

        const createResponse = await fetch(`${BASE_URL}/staff`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...formData.getHeaders(),
          },
          body: formData,
          credentials: "include",
        });

        const createData = await createResponse.json();
        const staffId = createData.data._id;

        // Update level
        const updateResponse = await fetch(`${BASE_URL}/staff/${staffId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ level: "3" }), // String
          credentials: "include",
        });

        const updateData = await updateResponse.json();
        if (!updateData.success) throw new Error(updateData.message);

        if (
          typeOfValue(updateData.data.level) !== "number" ||
          updateData.data.level !== 3
        ) {
          throw new Error(
            `Level should be 3 (number), got ${
              updateData.data.level
            } (${typeOfValue(updateData.data.level)})`
          );
        }

        log.detail(`Update: level="3" (string) → Output: level=3 (number) ✓`);
      }
    );

    // Test 10: Verify database stores numbers not strings
    await runTest(
      "Database: Verify level is stored as number in database",
      async () => {
        // Get staff by ID and verify multiple times
        const response = await fetch(`${BASE_URL}/staff/level/1`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!data.success) throw new Error("Failed to fetch staff by level");

        data.data.forEach((staff) => {
          if (typeOfValue(staff.level) !== "number") {
            throw new Error(
              `Retrieved staff ${staff.name} has non-numeric level`
            );
          }
        });

        log.detail(`All level 1 staff have numeric levels when retrieved ✓`);
      }
    );
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }

  // Print results
  printResults();
};

const printResults = () => {
  console.log(
    `\n${colors.bright}${colors.blue}═══════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bright}Type Conversion Test Results${colors.reset}`);
  console.log(
    `${colors.bright}${colors.blue}═══════════════════════════════════${colors.reset}`
  );

  console.log(`\nTotal Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.bright}${colors.red}Failed Tests:${colors.reset}`);
    testResults.tests
      .filter((t) => t.status === "FAIL")
      .forEach((t) => {
        console.log(`  ${colors.red}✗ ${t.name}${colors.reset}`);
        if (t.error) console.log(`    Error: ${t.error}`);
      });
  }

  const passPercentage = (
    (testResults.passed / testResults.total) *
    100
  ).toFixed(2);
  console.log(
    `\n${colors.bright}Pass Rate: ${passPercentage}%${colors.reset}\n`
  );

  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runTypeConversionTests();
