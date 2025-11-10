# 🧪 Staff API Test Guide

**Created:** November 10, 2025
**Version:** 1.0

---

## 📋 Overview

Comprehensive test suite untuk Staff API v2.0. Dua test files fokus pada berbagai aspek API:

1. **staff-api.test.js** - Comprehensive API testing
2. **staff-type-conversion.test.js** - Type conversion and validation testing

---

## 🚀 Quick Start

### Prerequisites
- Server running: `npm run dev` atau `node index.js`
- MongoDB running
- Redis running
- Admin user exists (default: admin@tdk.com / Tdk@123456)

### Run Tests

#### Test All Staff API Endpoints
```bash
npm run test:staff-api
```

#### Test Type Conversion (Level Field)
```bash
npm run test:staff-types
```

#### Run Both Tests
```bash
npm run test:staff-api && npm run test:staff-types
```

---

## 📄 Test File 1: staff-api.test.js

### Purpose
Comprehensive testing of all Staff API endpoints.

### What It Tests

#### GET Endpoints (No Auth Required)
- ✅ `GET /staff` - Get all staff
- ✅ `GET /staff/structure` - Get organizational structure grouped by level
- ✅ `GET /staff/level/:level` - Get staff by specific level
- ✅ `GET /staff/:id` - Get single staff by ID

#### POST Endpoints (Auth Required)
- ✅ `POST /staff` - Create staff with valid data
- ✅ `POST /staff` - Reject missing level field
- ✅ `POST /staff` - Reject invalid level value
- ✅ `POST /staff` - Reject without authentication

#### PUT Endpoints (Auth Required)
- ✅ `PUT /staff/:id` - Update staff details
- ✅ `PUT /staff/:id` - Update staff level
- ✅ `PUT /staff/:id` - Reject invalid level

#### PATCH Endpoints (Auth Required)
- ✅ `PATCH /staff/:id/status` - Toggle staff active status

#### DELETE Endpoints (Auth Required)
- ✅ `DELETE /staff/:id` - Delete staff

### Test Statistics
- **Total Tests:** 15
- **Coverage:** All endpoints
- **Auth Tests:** 3 (create, without auth, update)
- **Validation Tests:** 2 (missing level, invalid level)
- **Type Tests:** 1 (numeric level verification)

### Running the Test

```bash
npm run test:staff-api
```

### Expected Output
```
► Authenticating
  ✓ Logged in as admin@tdk.com

► Staff API Tests
  ✓ GET /staff - Get all staff
  ✓ GET /staff/structure - Get organizational structure
  ✓ GET /staff/level/:level - Get staff by level
  ✓ POST /staff - Create staff
  ✓ POST /staff - Create staff at level 2
  ✓ POST /staff - Missing level (should fail)
  ✓ POST /staff - Invalid level value (should fail)
  ✓ GET /staff/:id - Get single staff
  ✓ PUT /staff/:id - Update staff
  ✓ PUT /staff/:id - Update staff level
  ✓ PUT /staff/:id - Invalid level update (should fail)
  ✓ PATCH /staff/:id/status - Toggle staff status
  ✓ DELETE /staff/:id - Delete staff
  ✓ POST /staff - Without authentication (should fail)
  ✓ GET /staff - Verify all levels are numbers

═══════════════════════════════════
Test Results
═══════════════════════════════════

Total Tests: 15
Passed: 15
Failed: 0

Pass Rate: 100.00%
```

---

## 📄 Test File 2: staff-type-conversion.test.js

### Purpose
Focused testing on type conversion for the level field fix.

### What It Tests

#### Type Conversion Tests
- ✅ String "1" converts to number 1
- ✅ String "2" converts to number 2
- ✅ Numeric level sorting (not lexicographic)
- ✅ All retrieved staff have numeric levels
- ✅ Order field also converts to number
- ✅ Update level converts to number
- ✅ Database stores numbers not strings

#### Validation Tests
- ✅ Level must be >= 1
- ✅ Negative levels are rejected
- ✅ Non-numeric levels are rejected

### Key Test Cases

#### Test 1: String to Number Conversion
```javascript
// Input: level="1" (FormData sends strings)
// Expected: level=1 (stored as number in database)
// Verification: typeof level === 'number' && level === 1
```

#### Test 2: Numeric Sorting
```javascript
// Input: Create staff at levels 1, 2, 3, 1, 2
// Expected: getOrganizationalStructure groups by numeric level
// Verification: Keys are [1, 2, 3] not ["1", "2", "3"]
```

#### Test 3: Type Consistency
```javascript
// Input: GET all staff
// Expected: Every staff.level is a number
// Verification: data.data.forEach(staff => typeof staff.level === 'number')
```

### Test Statistics
- **Total Tests:** 10
- **Type Conversion Tests:** 5
- **Validation Tests:** 3
- **Database Verification:** 2

### Running the Test

```bash
npm run test:staff-types
```

### Expected Output
```
► Type Conversion Tests for Staff Level
  ✓ Type conversion: level="1" should be stored as number 1
    Input: level="1" (string)
    Output: level=1 (number)
  ✓ Type conversion: level="2" should be stored as number 2
    Input: level="2" (string) → Output: level=2 (number) ✓
  ✓ Type conversion: Numeric level sorting (not lexicographic)
    Levels found: 1, 2, 3
    Numeric sort correct ✓
  ✓ Type consistency: All retrieved staff have numeric levels
    All 10 staff have numeric levels ✓
  ✓ Validation: Level must be >= 1
    Correctly rejected level=0 ✓
  ✓ Validation: Negative levels are rejected
    Correctly rejected level=-5 ✓
  ✓ Validation: Non-numeric levels are rejected
    Correctly rejected level="abc" ✓
  ✓ Type conversion: order field also converts to number
    Input: order="5" (string) → Output: order=5 (number) ✓
  ✓ Type conversion: Update level also converts to number
    Update: level="3" (string) → Output: level=3 (number) ✓
  ✓ Database: Verify level is stored as number in database
    All level 1 staff have numeric levels when retrieved ✓

═══════════════════════════════════
Type Conversion Test Results
═══════════════════════════════════

Total Tests: 10
Passed: 10
Failed: 0

Pass Rate: 100.00%
```

---

## 🔄 Test Flow

### 1. Setup Phase
```
Login with admin credentials
  ↓
Get authentication token
  ↓
Ready for authenticated requests
```

### 2. GET Endpoints Testing
```
GET /staff (all staff)
  ↓
GET /staff/structure (grouped by level)
  ↓
GET /staff/level/:level (specific level)
  ↓
GET /staff/:id (single staff)
```

### 3. POST Endpoints Testing
```
POST /staff with valid data (success)
  ↓
POST /staff at level 2 (success)
  ↓
POST /staff without level (fails - validation)
  ↓
POST /staff with invalid level (fails - validation)
  ↓
POST /staff without auth (fails - auth)
```

### 4. PUT Endpoints Testing
```
PUT /staff/:id update details (success)
  ↓
PUT /staff/:id update level (success)
  ↓
PUT /staff/:id invalid level (fails - validation)
```

### 5. PATCH/DELETE Testing
```
PATCH /staff/:id/status (toggle active)
  ↓
DELETE /staff/:id (delete staff)
```

### 6. Verification Phase
```
Verify all levels are numbers (type consistency)
  ↓
Compare types and values
  ↓
Check database consistency
```

---

## 🎯 Test Coverage

### Endpoints Covered
- [x] GET /staff (all staff)
- [x] GET /staff/structure (organizational structure)
- [x] GET /staff/level/:level (by level)
- [x] GET /staff/:id (single staff)
- [x] POST /staff (create - valid)
- [x] POST /staff (create - invalid)
- [x] POST /staff (create - no auth)
- [x] PUT /staff/:id (update - valid)
- [x] PUT /staff/:id (update - invalid)
- [x] PATCH /staff/:id/status (toggle status)
- [x] DELETE /staff/:id (delete)

### Validations Covered
- [x] Required fields (name, position, level, short_description)
- [x] Level min value (1)
- [x] Level type (number)
- [x] Level range (>= 1)
- [x] Authentication requirement (POST, PUT, PATCH, DELETE)

### Type Conversions Covered
- [x] String level → number
- [x] String order → number
- [x] Type consistency in responses
- [x] Type consistency in database
- [x] Numeric vs lexicographic sorting

---

## 📊 Test Results Interpretation

### Success Indicators
- ✅ All tests pass (green checkmarks)
- ✅ Pass rate 100%
- ✅ No failed tests
- ✅ All assertions pass

### Failure Scenarios

#### Missing Auth Token
```
Error: Failed to authenticate
Solution: Verify admin user exists and credentials are correct
```

#### Database Connection Error
```
Error: Failed to fetch /staff
Solution: Check MongoDB is running on localhost:27017
```

#### Redis Connection Error
```
Error: Failed to create staff
Solution: Check Redis is running on localhost:6379
```

#### Type Conversion Failure
```
Error: Level should be number, got string
Solution: Check validator has .toInt(), service has parseInt()
```

---

## 🔍 Debugging Failed Tests

### Enable Verbose Output
Modify the test files to add detailed logging:

```javascript
// Add this before assertions
console.log('Response:', JSON.stringify(data, null, 2));
console.log('Level type:', typeof data.data.level);
console.log('Level value:', data.data.level);
```

### Check Database Directly
```bash
# Connect to MongoDB
mongosh mongodb://admin:strongpassword123@localhost:27017/tdk-db?authSource=admin

# Check staff collection
db.staffs.find().pretty()

# Verify level type
db.staffs.findOne({}).level
# Should show: NumberInt(1), not "1" as string
```

### Check Response in Browser
```javascript
// Use browser console while server is running
fetch('http://localhost:5000/api/staff')
  .then(r => r.json())
  .then(d => {
    console.log('All levels:', d.data.map(s => ({ name: s.name, level: s.level, type: typeof s.level })))
  })
```

---

## 📈 Performance Considerations

### Test Duration
- **staff-api.test.js:** ~5-10 seconds
- **staff-type-conversion.test.js:** ~5-10 seconds
- **Total:** ~10-20 seconds

### Network Requests
- **Total API calls:** 25+
- **Database operations:** 30+
- **Network connections:** 1 (persistent)

### Resource Usage
- Memory: ~50MB
- CPU: Low (<5%)
- Disk I/O: Minimal

---

## 🛠️ Customizing Tests

### Change Admin Credentials
Edit the test files and modify:
```javascript
const ADMIN_EMAIL = 'admin@tdk.com';
const ADMIN_PASSWORD = 'Tdk@123456';
```

### Add More Test Cases
Example - Add new test for creating staff with image:
```javascript
await runTest('POST /staff - Create with image', async () => {
  const formData = new FormData();
  formData.append('name', 'John with Image');
  formData.append('position', 'CEO');
  formData.append('level', '1');
  formData.append('short_description', 'Test');
  formData.append('photo', fs.createReadStream('./test-image.jpg'));

  // ... rest of test
});
```

### Change Base URL
```javascript
const BASE_URL = 'http://your-api:5000/api';
```

---

## 📝 Test Output Examples

### Successful Run
```
✓ Test Name 1
✓ Test Name 2
...
Pass Rate: 100.00%
```

### Failed Test
```
✗ Test Name
  Error: Expected value 1, got string "1"
```

### Partial Failure
```
Pass Rate: 80.00%
Failed Tests:
  ✗ Type conversion: level="abc" should be rejected
    Error: Should reject non-numeric levels
```

---

## 🔗 Related Documentation

- **STAFF_API.md** - Complete API endpoint documentation
- **STAFF_LEVEL_FIX.md** - Type conversion issue analysis
- **CODE_CHANGES_SUMMARY.md** - Implementation details

---

## ✨ Features

### Test Framework
- ✅ No external test framework (pure JavaScript)
- ✅ Colored console output
- ✅ Detailed error messages
- ✅ Pass/fail statistics
- ✅ Easy to extend

### Test Types
- ✅ Functional tests (all endpoints)
- ✅ Validation tests (error cases)
- ✅ Type conversion tests (number verification)
- ✅ Integration tests (full flow)
- ✅ Security tests (auth required)

### Error Handling
- ✅ Detailed error messages
- ✅ Test stack traces
- ✅ Request/response logging
- ✅ Type verification

---

## 🚀 CI/CD Integration

### Run Tests in Pipeline
```yaml
- name: Run Staff API Tests
  run: npm run test:staff-api

- name: Run Type Conversion Tests
  run: npm run test:staff-types
```

### Exit Codes
- `0` = All tests pass
- `1` = One or more tests fail

---

**Status:** ✅ Ready to Use
**Last Updated:** November 10, 2025
