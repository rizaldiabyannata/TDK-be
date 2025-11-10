# 🚀 Quick Reference: Staff API v2.0

## What Changed?

| Aspect             | Before                         | After                           |
| ------------------ | ------------------------------ | ------------------------------- |
| **Hierarchy**      | Parent-child relationships     | Simple numeric levels           |
| **Structure**      | Complex recursive queries      | Flat list or grouped by level   |
| **Level Type**     | String (sometimes)             | Always Number                   |
| **Move Operation** | Move staff to different parent | Change level (no move needed)   |
| **Children Query** | Get all children of parent     | Get all staff at specific level |

---

## API Endpoints Summary

```
GET    /api/staff                      - All staff (sorted by level)
GET    /api/staff/structure            - Grouped by level
GET    /api/staff/level/:level         - Staff at specific level
GET    /api/staff/:id                  - Single staff

POST   /api/staff                      - Create (auth required)
PUT    /api/staff/:id                  - Update (auth required)
PATCH  /api/staff/:staffId/status      - Toggle status (auth required)
DELETE /api/staff/:id                  - Delete (auth required)
```

---

## Level System Explained

```
Level 1: Executive (CEO, Founder)
Level 2: Management (VP, Director, CTO)
Level 3: Mid-Management (Manager, Team Lead)
Level 4: Staff (Developer, Analyst, Designer)
Level 5+: Junior/Support roles
```

**Key Points:**

- Levels are numeric (1, 2, 3, ...)
- Minimum level is 1
- `order` field controls display order within same level
- No parent-child relationships

---

## Creating Staff

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append("name", "John Doe");
formData.append("position", "CEO");
formData.append("level", "1"); // Can be string, will convert to 1
formData.append("short_description", "Chief Executive Officer");
formData.append("photo", photoFile);
formData.append("order", "0"); // Optional, default 0
formData.append(
  "socialMedia",
  JSON.stringify([{ platform: "LinkedIn", url: "https://linkedin.com/..." }])
);

const response = await fetch("/api/staff", {
  method: "POST",
  body: formData,
  credentials: "include",
});
const result = await response.json();
console.log(result.data); // New staff object
```

### cURL

```bash
curl -X POST http://localhost:5000/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe" \
  -F "position=CEO" \
  -F "level=1" \
  -F "short_description=Chief Executive Officer" \
  -F "photo=@/path/to/photo.jpg" \
  -F "order=0"
```

---

## Response Formats

### Success (Create)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "position": "CEO",
    "level": 1,
    "order": 0,
    "isActive": true,
    "createdAt": "2025-11-10T10:30:00Z",
    "updatedAt": "2025-11-10T10:30:00Z"
  }
}
```

### Success (List)

```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "John", "level": 1, ... },
    { "_id": "...", "name": "Jane", "level": 2, ... }
  ],
  "count": 2
}
```

### Success (Structure)

```json
{
  "success": true,
  "data": {
    "1": [{ "_id": "...", "name": "John", "level": 1, "order": 0 }],
    "2": [
      { "_id": "...", "name": "Jane", "level": 2, "order": 0 },
      { "_id": "...", "name": "Bob", "level": 2, "order": 1 }
    ]
  },
  "count": 3,
  "levels": 2
}
```

### Error

```json
{
  "success": false,
  "message": "Level tidak valid",
  "errors": [
    {
      "field": "level",
      "message": "Level harus berupa angka positif minimal 1"
    }
  ]
}
```

---

## Type Conversion Guarantee

**The Problem:**
FormData sends `level` as string `"1"`, but we need it stored as number `1`.

**The Solution - 3 Layer Check:**

1. **Validator Layer** - `.toInt()` converts "1" → 1
2. **Controller Layer** - `parseInt()` + `isNaN()` check
3. **Service Layer** - `parseInt()` defensive parsing

**Result:** No matter what input format, level is always stored as number.

---

## Common Operations

### Get All Staff (Sorted by Level)

```javascript
const response = await fetch("/api/staff");
const { data } = await response.json();
// data is array sorted by level: 1, 1, 2, 2, 2, 3, ...
```

### Get Organizational Structure (Grouped)

```javascript
const response = await fetch("/api/staff/structure");
const { data, count, levels } = await response.json();
// data = { "1": [...], "2": [...], "3": [...] }
// count = total staff count
// levels = number of different levels
```

### Get Staff at Specific Level

```javascript
const response = await fetch("/api/staff/level/2");
const { data, count } = await response.json();
// data = all staff with level 2
```

### Update Staff Level

```javascript
const response = await fetch(`/api/staff/${staffId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ level: 3 }),
  credentials: "include",
});
```

---

## Troubleshooting

### Error: "Level wajib diisi"

**Cause:** Level field not provided in request
**Fix:** Add `level` to FormData or request body

### Error: "Level harus berupa angka positif minimal 1"

**Cause:** Level is 0, negative, or invalid format
**Fix:** Use number ≥ 1 (e.g., 1, 2, 3, ...)

### Error: "Level tidak valid"

**Cause:** Level couldn't be parsed as number
**Fix:** Ensure level is numeric string or number

### Staff Not Appearing in Results

**Cause:** Staff has `isActive: false`
**Fix:** Toggle status or check isActive flag

### Level Sorting Looks Wrong

**Cause:** Old string-based levels from before migration
**Fix:** Verify levels in database are Numbers not Strings

---

## Migration from Old System

If migrating from parent-child system:

1. **Backup old data**

   ```bash
   mongodump --db your_db
   ```

2. **Run migration script** (create if needed)

   - Analyze current parent-child relationships
   - Assign appropriate levels based on depth
   - Remove parent field references

3. **Verify conversion**

   ```bash
   db.staffs.find({ level: { $type: "int" } })
   ```

4. **Test all endpoints**
   ```bash
   npm test
   node test/smoke-test.js
   ```

---

## Performance Tips

1. **Use `/structure` for tree view**

   - Already grouped by level
   - No need for client-side grouping

2. **Use `/level/:level` for filtering**

   - Faster than client-side filtering
   - Server-side queries are optimized

3. **Cache organizational structure**

   - Rarely changes
   - Can be cached for 5-10 minutes

4. **Index on `{ level: 1, order: 1 }`**
   - Already in place
   - Ensures fast queries

---

## Security Notes

- ✅ Create/Update/Delete require authentication
- ✅ File uploads checked for valid image types
- ✅ Input validated at multiple layers
- ✅ No parent-child traversal vulnerabilities
- ✅ Response format consistent for all users

---

## Quick Command Reference

```bash
# Create staff
curl -X POST http://localhost:5000/api/staff \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=John" -F "position=CEO" -F "level=1" \
  -F "short_description=..." -F "photo=@image.jpg"

# Get all staff
curl http://localhost:5000/api/staff

# Get structure
curl http://localhost:5000/api/staff/structure

# Get level 2
curl http://localhost:5000/api/staff/level/2

# Update staff
curl -X PUT http://localhost:5000/api/staff/ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level": 2}'

# Delete staff
curl -X DELETE http://localhost:5000/api/staff/ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Related Documentation

- **STAFF_API.md** - Complete API documentation
- **STAFF_LEVEL_FIX.md** - Type conversion details
- **CHANGELOG_STAFF_API.md** - All changes detailed
- **IMPLEMENTATION_SUMMARY.md** - Technical summary

---

**Last Updated:** November 10, 2025
**Status:** ✅ Production Ready
