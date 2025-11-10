# TDK Backend API - Postman Collection

## 📦 File: `TDK_Postman_Collection.json`

Collection lengkap untuk testing semua API endpoint TDK Backend dengan Postman.

---

## 🚀 Cara Import ke Postman

### Step 1: Buka Postman

1. Buka aplikasi Postman
2. Klik **Import** di kiri atas

### Step 2: Import File

1. Pilih tab **File**
2. Klik **Upload Files**
3. Pilih file `TDK_Postman_Collection.json`
4. Klik **Import**

### Step 3: Setup Environment (Optional)

1. Klik **Environments** di sidebar kiri
2. Klik **+** untuk create environment baru
3. Set variable:
   - `base_url`: `http://localhost:5000/api`
   - `auth_token`: (akan terisi otomatis setelah login)
   - `refresh_token`: (akan terisi otomatis setelah login)
   - `staff_id`: (akan terisi otomatis setelah create staff)

---

## 📁 Struktur Collection

### 🔐 **Authentication** (8 endpoints)

- Login - Get access token
- Refresh Token - Refresh expired token
- Check Session - Verify session status
- Get User Profile - Get user info
- Update User Profile - Update profile
- Request Password Reset - Send OTP
- Reset Password - Reset with OTP
- Logout - Invalidate session

### 👥 **Staff Management (NEW)** (8 endpoints)

- Get All Staff - List with pagination
- Get Organizational Structure - Grouped by level
- Get Staff by Level - Filter by level
- Get Staff by ID - Single staff detail
- Create Staff - Add new staff (with photo)
- Update Staff - Modify staff data
- Toggle Staff Status - Activate/deactivate
- Delete Staff - Remove staff

### 📝 **Blog Management** (8 endpoints)

- Get All Blogs - List with filters
- Get Blog Archives - Archive data
- Get Blog by Slug - Single blog
- Create Blog - Add new blog
- Update Blog - Modify blog
- Archive/Unarchive Blog - Status management
- Delete Blog - Remove blog

### 💼 **Portfolio Management** (8 endpoints)

- Get All Portfolios - List with filters
- Get Portfolio Archives - Archive data
- Get Portfolio by Slug - Single portfolio
- Create Portfolio - Add new portfolio
- Update Portfolio - Modify portfolio
- Archive/Unarchive Portfolio - Status management
- Delete Portfolio - Remove portfolio

### 📞 **Contact Form** (2 endpoints)

- Submit Contact Form - Public submission
- Get All Contact Forms - Admin view

### 📊 **Statistics & Analytics** (1 endpoint)

- Get Dashboard Statistics - Overview metrics

### 🎯 **Content Tracking** (5 endpoints)

- Get Home Page Content - Featured content
- Add Featured Blog - Add to featured
- Add Highlighted Portfolio - Add to highlighted
- Reset Home Page Content - Reset to default
- Remove Featured Blog - Remove from featured

### 📤 **File Upload** (1 endpoint)

- Upload Image - Upload with auto WebP conversion

### 🔧 **System & Testing** (3 endpoints)

- Test Route - Basic connectivity
- Server Runtime Info - Uptime info
- Redis Connection Test - Redis health check

---

## 🔑 Authentication Flow

### Step 1: Login

1. Buka request **"Login"** di folder Authentication
2. Klik **Send**
3. Token akan otomatis tersimpan di collection variables

### Step 2: Use Authenticated Requests

- Semua request yang butuh auth akan menggunakan `{{auth_token}}`
- Token akan otomatis include di Authorization header

### Step 3: Handle Token Expiration

- Jika token expired, gunakan **"Refresh Token"**
- Atau login ulang

---

## 🎯 Testing Staff API (Fokus Utama)

### Create Staff Flow:

1. **Login** → Get token
2. **Create Staff** → Upload foto + data
3. **Get All Staff** → Verify creation
4. **Update Staff** → Modify data
5. **Toggle Status** → Activate/deactivate
6. **Delete Staff** → Remove

### Key Features Tested:

- ✅ **Type Conversion**: `level="1"` → `level=1` (number)
- ✅ **Validation**: Required fields, min values
- ✅ **File Upload**: Photo upload dengan WebP conversion
- ✅ **Authentication**: Protected routes
- ✅ **Response Format**: Consistent JSON structure

---

## 📋 Sample Data

### Staff Creation:

```json
{
  "name": "John Doe",
  "position": "Software Developer",
  "level": "1",
  "short_description": "Experienced developer",
  "description": "Full-stack developer...",
  "photo": "[FILE]"
}
```

### Blog Creation:

```json
{
  "title": "Sample Blog",
  "content": "Blog content...",
  "excerpt": "Short excerpt",
  "tags": "technology, programming",
  "status": "draft",
  "coverImage": "[FILE]"
}
```

---

## ⚙️ Environment Variables

| Variable        | Default                     | Description       |
| --------------- | --------------------------- | ----------------- |
| `base_url`      | `http://localhost:5000/api` | API base URL      |
| `auth_token`    | _(auto-filled)_             | JWT access token  |
| `refresh_token` | _(auto-filled)_             | JWT refresh token |
| `staff_id`      | _(auto-filled)_             | Created staff ID  |

---

## 🚦 Response Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 422  | Validation Error      |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

---

## 🔒 Security Features

- **JWT Authentication** - Bearer token
- **Rate Limiting** - Login: 5/min, Contact: 10/15min
- **CORS** - Configured for development
- **Helmet** - Security headers
- **Input Validation** - Express-validator
- **File Upload Security** - Multer + WebP conversion

---

## 📊 Testing Statistics

| Category             | Endpoints        | Status               |
| -------------------- | ---------------- | -------------------- |
| Authentication       | 8                | ✅ Complete          |
| Staff Management     | 8                | ✅ Complete          |
| Blog Management      | 8                | ✅ Complete          |
| Portfolio Management | 8                | ✅ Complete          |
| Contact Form         | 2                | ✅ Complete          |
| Statistics           | 1                | ✅ Complete          |
| Content Tracking     | 5                | ✅ Complete          |
| File Upload          | 1                | ✅ Complete          |
| System               | 3                | ✅ Complete          |
| **TOTAL**            | **36 endpoints** | **✅ 100% Complete** |

---

## 🎉 Ready to Use!

Collection ini siap digunakan untuk:

- ✅ **Development testing**
- ✅ **API documentation**
- ✅ **Integration testing**
- ✅ **Demo purposes**
- ✅ **Client integration**

**Import sekarang dan mulai testing! 🚀**
