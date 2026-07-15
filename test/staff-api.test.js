import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = "http://localhost:5000/api";
const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "password";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test Results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper functions
const log = {
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.blue}► ${msg}${colors.reset}`),
  test: (msg) => console.log(`  ${colors.cyan}○ ${msg}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`  ${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`  ${colors.yellow}ℹ ${msg}${colors.reset}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
};

const assertExists = (value, message) => {
  if (!value) {
    throw new Error(message);
  }
};

// Test helper
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

// Login and get token
const login = async () => {
  log.header("Authenticating");
  try {
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

    log.success(`Logged in as ${ADMIN_EMAIL}`);
    return data.data.accessToken;
  } catch (error) {
    log.error(`Login failed: ${error.message}`);
    throw error;
  }
};

// Main test suite
const runStaffAPITests = async () => {
  let authToken;
  let staffIds = [];

  try {
    // Authenticate
    authToken = await login();

    log.header("Staff API Tests");

    // Test 1: Get all staff (should work without auth)
    await runTest("GET /staff - Get all staff", async () => {
      const response = await fetch(`${BASE_URL}/staff`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      assertEquals(data.success, true, "Response should be successful");
      assert(Array.isArray(data.data), "Data should be an array");
      assertExists(data.count !== undefined, "Count should exist");
      log.info(`Found ${data.count} staff members`);
    });

    // Test 2: Get organizational structure
    await runTest(
      "GET /staff/structure - Get organizational structure",
      async () => {
        const response = await fetch(`${BASE_URL}/staff/structure`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        assertEquals(data.success, true, "Response should be successful");
        assert(
          typeof data.data === "object",
          "Data should be an object (grouped by level)"
        );
        assertExists(data.levels !== undefined, "Levels count should exist");
        log.info(`Found ${data.levels} different staff levels`);
      }
    );

    // Test 3: Get staff by level
    await runTest("GET /staff/level/:level - Get staff by level", async () => {
      const response = await fetch(`${BASE_URL}/staff/level/1`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      assertEquals(data.success, true, "Response should be successful");
      assert(Array.isArray(data.data), "Data should be an array");
      assertExists(data.count !== undefined, "Count should exist");

      // Verify all staff are level 1
      data.data.forEach((staff) => {
        assertEquals(typeof staff.level, "number", "Level should be a number");
        assertEquals(staff.level, 1, "Level should be 1");
      });

      log.info(`Found ${data.count} staff at level 1`);
    });

    // Test 4: Create staff (without image)
    await runTest("POST /staff - Create staff", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe CEO");
      formData.append("position", "CEO");
      formData.append("level", "1");
      formData.append("order", "0");
      formData.append("shortDescription", "Chief Executive Officer");
      formData.append(
        "socialMedia",
        JSON.stringify([
          { platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
        ])
      );

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
      assertEquals(data.success, true, "Response should be successful");
      assertExists(data.data._id, "Staff ID should exist");
      assertEquals(
        typeof data.data.level,
        "number",
        "Level should be a number"
      );
      assertEquals(
        data.data.level,
        1,
        "Level should be stored as number 1, not string"
      );
      assertEquals(data.data.order, 0, "Order should be 0");

      staffIds.push(data.data._id);
      log.info(
        `Created staff with ID: ${data.data._id}, Level (type): ${typeof data
          .data.level}`
      );
    });

    // Test 5: Create staff with level 2
    await runTest("POST /staff - Create staff at level 2", async () => {
      const formData = new FormData();
      formData.append("name", "Jane Manager");
      formData.append("position", "VP Engineering");
      formData.append("level", "2");
      formData.append("order", "0");
      formData.append("shortDescription", "Vice President of Engineering");
      formData.append("socialMedia", JSON.stringify([]));

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
      assertEquals(data.success, true, "Response should be successful");
      assertEquals(
        typeof data.data.level,
        "number",
        "Level should be a number"
      );
      assertEquals(data.data.level, 2, "Level should be 2");

      staffIds.push(data.data._id);
      log.info(`Created staff at level 2 with ID: ${data.data._id}`);
    });

    // Test 6: Create staff - Missing level (should fail)
    await runTest("POST /staff - Missing level (should fail)", async () => {
      const formData = new FormData();
      formData.append("name", "Invalid Staff");
      formData.append("position", "Invalid Position");
      formData.append("shortDescription", "Missing level");
      // Not appending level field

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
      assertEquals(data.success, false, "Response should fail");
      assert(
        data.errors && data.errors.length > 0,
        "Should return validation errors"
      );
      log.info("Correctly rejected request without level field");
    });

    // Test 7: Create staff - Invalid level (should fail)
    await runTest(
      "POST /staff - Invalid level value (should fail)",
      async () => {
        const formData = new FormData();
        formData.append("name", "Invalid Staff");
        formData.append("position", "Invalid Position");
        formData.append("level", "abc"); // Invalid
        formData.append("shortDescription", "Invalid level");

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
        assertEquals(data.success, false, "Response should fail");
        log.info("Correctly rejected request with invalid level");
      }
    );

    // Test 8: Get single staff by ID
    if (staffIds.length > 0) {
      await runTest("GET /staff/:id - Get single staff", async () => {
        const response = await fetch(`${BASE_URL}/staff/${staffIds[0]}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        assertEquals(data.success, true, "Response should be successful");
        assertEquals(data.data._id, staffIds[0], "ID should match");
        assertEquals(
          typeof data.data.level,
          "number",
          "Level should be a number"
        );
        log.info(
          `Retrieved staff: ${data.data.name} (Level: ${
            data.data.level
          }, Type: ${typeof data.data.level})`
        );
      });
    }

    // Test 9: Update staff
    if (staffIds.length > 0) {
      await runTest("PUT /staff/:id - Update staff", async () => {
        const formData = new FormData();
        formData.append("position", "Chief Executive Officer - Updated");
        formData.append("shortDescription", "Updated description");

        const response = await fetch(`${BASE_URL}/staff/${staffIds[0]}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...formData.getHeaders(),
          },
          body: formData,
          credentials: "include",
        });

        const data = await response.json();
        assertEquals(data.success, true, "Response should be successful");
        assertEquals(
          data.data.position,
          "Chief Executive Officer - Updated",
          "Position should be updated"
        );
        log.info(`Updated staff: ${data.data.name}`);
      });
    }

    // Test 10: Update staff level
    if (staffIds.length > 0) {
      await runTest("PUT /staff/:id - Update staff level", async () => {
        const response = await fetch(`${BASE_URL}/staff/${staffIds[0]}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ level: 2 }),
          credentials: "include",
        });

        const data = await response.json();
        assertEquals(data.success, true, "Response should be successful");
        assertEquals(
          typeof data.data.level,
          "number",
          "Level should be a number"
        );
        assertEquals(data.data.level, 2, "Level should be updated to 2");
        log.info(`Updated staff level to ${data.data.level}`);
      });
    }

    // Test 11: Update staff - Invalid level (should fail)
    if (staffIds.length > 0) {
      await runTest(
        "PUT /staff/:id - Invalid level update (should fail)",
        async () => {
          const response = await fetch(`${BASE_URL}/staff/${staffIds[0]}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ level: 0 }), // Invalid - min is 1
            credentials: "include",
          });

          const data = await response.json();
          assertEquals(data.success, false, "Response should fail");
          log.info("Correctly rejected invalid level (0)");
        }
      );
    }

    // Test 12: Toggle staff status
    if (staffIds.length > 1) {
      await runTest(
        "PATCH /staff/:id/status - Toggle staff status",
        async () => {
          const response = await fetch(
            `${BASE_URL}/staff/${staffIds[1]}/status`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ isActive: false }),
              credentials: "include",
            }
          );

          const data = await response.json();
          assertEquals(data.success, true, "Response should be successful");
          assertEquals(data.data.isActive, false, "isActive should be false");
          log.info(`Toggled staff status to: ${data.data.isActive}`);
        }
      );
    }

    // Test 13: Delete staff
    if (staffIds.length > 1) {
      await runTest("DELETE /staff/:id - Delete staff", async () => {
        const response = await fetch(`${BASE_URL}/staff/${staffIds[1]}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();
        assertEquals(data.success, true, "Response should be successful");
        log.info(`Deleted staff: ${data.data.name}`);
      });
    }

    // Test 14: Create staff without auth (should fail)
    await runTest(
      "POST /staff - Without authentication (should fail)",
      async () => {
        const formData = new FormData();
        formData.append("name", "Unauthorized Staff");
        formData.append("position", "Test Position");
        formData.append("level", "1");
        formData.append("shortDescription", "Test");

        const response = await fetch(`${BASE_URL}/staff`, {
          method: "POST",
          headers: {
            // No Authorization header
            ...formData.getHeaders(),
          },
          body: formData,
        });

        const data = await response.json();
        assertEquals(data.success, false, "Response should fail");
        log.info("Correctly rejected request without authentication");
      }
    );

    // Test 15: Verify level type consistency
    await runTest("GET /staff - Verify all levels are numbers", async () => {
      const response = await fetch(`${BASE_URL}/staff`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      data.data.forEach((staff) => {
        assertEquals(
          typeof staff.level,
          "number",
          `Staff ${staff.name} should have level as number`
        );
        assert(staff.level >= 1, `Staff ${staff.name} level should be >= 1`);
      });
      log.info(`Verified ${data.count} staff - all have numeric levels`);
    });
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
  console.log(`${colors.bright}Test Results${colors.reset}`);
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
runStaffAPITests();
