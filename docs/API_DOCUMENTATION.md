# TDK Backend API Documentation

Base URL: `http://localhost:5000/api` (Development)  
Base URL Production: `http://YOUR_IP:5000/api`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Blog](#blog)
4. [Portfolio](#portfolio)
5. [Staff](#staff)
6. [Services](#services)
7. [Contact Form](#contact-form)
8. [Statistics](#statistics)
9. [Content Tracking](#content-tracking)

---

## 🔐 Authentication

### Login

```http
POST /api/user/login
```

**Request Body:**

```json
{
  "name": "admin",
  "password": "password"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "name": "admin",
    "email": "admin@example.com"
  }
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### Logout

```http
POST /api/user/logout
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Logout successful"
}
```

---

### Get User Profile (Temporary - No Auth)

```http
GET /api/user/profile
```

**Response (200):**

```json
{
  "message": "Profile endpoint (temporary no auth)",
  "user": {
    "username": "guest",
    "email": null
  }
}
```

---

### Update User

```http
PUT /api/user/update
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "email": "newemail@example.com",
  "name": "newname",
  "password": "newpassword" // optional
}
```

**Response (200):**

```json
{
  "message": "Admin user updated successfully",
  "user": {
    "email": "newemail@example.com",
    "name": "newname"
  }
}
```

---

### Request Password Reset OTP

```http
POST /api/user/request-password-reset
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "OTP has been sent to your email"
}
```

---

### Reset Password with OTP

```http
POST /api/user/reset-password
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response (200):**

```json
{
  "message": "Password reset successful"
}
```

---

## 📝 Blog

### Get All Blogs

```http
GET /api/blogs?page=1&limit=10&status=published&search=keyword&sortBy=createdAt&order=desc
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): published | draft | archived
- `search` (optional): Search in title and content
- `sortBy` (optional): Field to sort by
- `order` (optional): asc | desc

**Response (200):**

```json
{
  "blogs": [
    {
      "_id": "...",
      "title": "Blog Title",
      "slug": "blog-title",
      "content": "Blog content...",
      "excerpt": "Short excerpt...",
      "coverImage": "http://...",
      "author": "...",
      "status": "published",
      "views": 100,
      "createdAt": "2025-11-05T...",
      "updatedAt": "2025-11-05T..."
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

---

### Get Blog by Slug

```http
GET /api/blogs/:slug
```

**Response (200):**

```json
{
  "_id": "...",
  "title": "Blog Title",
  "slug": "blog-title",
  "content": "Full blog content...",
  "coverImage": "http://...",
  "author": "...",
  "status": "published",
  "views": 101,
  "createdAt": "2025-11-05T..."
}
```

---

### Get Blog Archives

```http
GET /api/blogs/archives
```

**Response (200):**

```json
{
  "archives": [
    {
      "year": 2025,
      "months": [
        {
          "month": 11,
          "count": 5
        }
      ]
    }
  ]
}
```

---

### Create Blog

```http
POST /api/blogs
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**

- `title` (required): Blog title
- `content` (required): Blog content
- `excerpt` (optional): Short description
- `coverImage` (required): Image file
- `status` (optional): published | draft (default: draft)

**Response (201):**

```json
{
  "message": "Blog created successfully",
  "blog": { ... }
}
```

---

### Update Blog

```http
PUT /api/blogs/:slug
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**

- `title` (optional)
- `content` (optional)
- `excerpt` (optional)
- `coverImage` (optional): New image file
- `status` (optional)

**Response (200):**

```json
{
  "message": "Blog updated successfully",
  "blog": { ... }
}
```

---

### Delete Blog

```http
DELETE /api/blogs/:slug
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Blog deleted successfully"
}
```

---

### Archive Blog

```http
PATCH /api/blogs/:slug/archive
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Blog archived successfully",
  "blog": { ... }
}
```

---

### Unarchive Blog

```http
PATCH /api/blogs/:slug/unarchive
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Blog unarchived successfully",
  "blog": { ... }
}
```

---

## 🎨 Portfolio

### Get All Portfolio Items

```http
GET /api/portos?page=1&limit=10&status=published&search=keyword
```

**Query Parameters:** Same as blogs

**Response (200):**

```json
{
  "portos": [
    {
      "_id": "...",
      "title": "Project Title",
      "slug": "project-title",
      "description": "Project description...",
      "coverImage": "http://...",
      "client": "Client Name",
      "projectUrl": "https://...",
      "technologies": ["React", "Node.js"],
      "status": "published",
      "views": 50,
      "createdAt": "2025-11-05T..."
    }
  ],
  "pagination": { ... }
}
```

---

### Get Portfolio by Slug

```http
GET /api/portos/:slug
```

**Response (200):**

```json
{
  "_id": "...",
  "title": "Project Title",
  "slug": "project-title",
  "description": "Full project description...",
  "coverImage": "http://...",
  "client": "Client Name",
  "projectUrl": "https://...",
  "technologies": ["React", "Node.js"],
  "status": "published",
  "views": 51
}
```

---

### Create Portfolio

```http
POST /api/portos
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**

- `title` (required)
- `description` (required)
- `coverImage` (required): Image file
- `client` (optional)
- `projectUrl` (optional)
- `technologies` (optional): JSON array
- `status` (optional): published | draft

**Response (201):**

```json
{
  "message": "Portfolio created successfully",
  "porto": { ... }
}
```

---

### Update Portfolio

```http
PUT /api/portos/:slug
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Response (200):**

```json
{
  "message": "Portfolio updated successfully",
  "porto": { ... }
}
```

---

### Delete Portfolio

```http
DELETE /api/portos/:slug
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Portfolio deleted successfully"
}
```

---

### Archive/Unarchive Portfolio

```http
PATCH /api/portos/:slug/archive
PATCH /api/portos/:slug/unarchive
```

Same as blog archive/unarchive

---

## 👥 Staff

### Get All Staff

```http
GET /api/staff
```

**Response (200):**

```json
[
  {
    "_id": "...",
    "name": "John Doe",
    "position": "CEO",
    "photo": "http://...",
    "bio": "Biography...",
    "email": "john@example.com",
    "phone": "+1234567890",
    "socialMedia": {
      "linkedin": "https://...",
      "twitter": "https://..."
    },
    "createdAt": "2025-11-05T..."
  }
]
```

---

### Get Staff by ID

```http
GET /api/staff/:id
```

**Response (200):**

```json
{
  "_id": "...",
  "name": "John Doe",
  "position": "CEO",
  "photo": "http://...",
  "bio": "Biography..."
}
```

---

### Create Staff

```http
POST /api/staff
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**

- `name` (required)
- `position` (required)
- `photo` (required): Image file
- `bio` (optional)
- `email` (optional)
- `phone` (optional)
- `socialMedia` (optional): JSON object

**Response (201):**

```json
{
  "_id": "...",
  "name": "John Doe",
  "position": "CEO",
  "photo": "http://..."
}
```

---

### Update Staff

```http
PUT /api/staff/:id
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:** Same as create (all optional)

**Response (200):**

```json
{
  "_id": "...",
  "name": "John Doe Updated",
  "position": "CTO"
}
```

---

### Delete Staff

```http
DELETE /api/staff/:id
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (204):** No content

---

## 🛠️ Services

### Get All Services

```http
GET /api/services
```

**Response (200):**

```json
[
  {
    "_id": "...",
    "title": "Web Development",
    "description": "Service description...",
    "image": "http://...",
    "features": ["Feature 1", "Feature 2"],
    "price": "Starting from $1000",
    "createdAt": "2025-11-05T..."
  }
]
```

---

### Get Service by ID

```http
GET /api/services/:id
```

**Response (200):**

```json
{
  "_id": "...",
  "title": "Web Development",
  "description": "Full service description...",
  "image": "http://...",
  "features": ["Feature 1", "Feature 2"],
  "price": "Starting from $1000"
}
```

---

### Create Service

```http
POST /api/services
```

**Headers:**

```
Content-Type: multipart/form-data
```

**Form Data:**

- `title` (required)
- `description` (required)
- `image` (required): Image file
- `features` (optional): JSON array
- `price` (optional)

**Response (201):**

```json
{
  "_id": "...",
  "title": "Web Development",
  "description": "Service description..."
}
```

---

### Update Service

```http
PUT /api/services/:id
```

**Headers:**

```
Content-Type: multipart/form-data
```

**Form Data:** Same as create (all optional)

**Response (200):**

```json
{
  "_id": "...",
  "title": "Web Development Updated"
}
```

---

### Delete Service

```http
DELETE /api/services/:id
```

**Response (204):** No content

---

## 📧 Contact Form

### Submit Contact Form

```http
POST /api/contact
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Hello, I would like to know more about..."
}
```

**Response (201):**

```json
{
  "message": "Contact form submitted successfully",
  "contactForm": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Inquiry",
    "message": "Hello...",
    "createdAt": "2025-11-05T..."
  }
}
```

**Rate Limit:** 10 submissions per 15 minutes per IP

---

### Get All Contact Forms (Admin)

```http
GET /api/contact
```

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
[
  {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Inquiry",
    "message": "Hello...",
    "createdAt": "2025-11-05T...",
    "read": false
  }
]
```

---

## 📊 Statistics

### Get Dashboard Statistics

```http
GET /api/statistics
```

**Response (200):**

```json
{
  "totalBlogs": 25,
  "totalPortfolios": 15,
  "totalStaff": 10,
  "totalServices": 8,
  "totalContacts": 50,
  "totalViews": 5000,
  "recentBlogs": [...],
  "recentPortfolios": [...],
  "popularContent": [...]
}
```

---

## 🎯 Content Tracking

### Track Content View

Views are automatically tracked when accessing:

- `GET /api/blogs/:slug`
- `GET /api/portos/:slug`

Headers used for tracking:

- `User-Agent`: Browser/device info
- `X-Forwarded-For` / `X-Real-IP`: Client IP

---

## 🔒 Authentication Flow

1. **Login** - Get accessToken
2. **Store Token** - Save to localStorage/sessionStorage
3. **Use Token** - Include in Authorization header:
   ```
   Authorization: Bearer {accessToken}
   ```
4. **Handle 401** - Token expired, redirect to login
5. **Logout** - Clear token, call logout endpoint

---

## 📝 Common Response Codes

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | Success                          |
| 201  | Created                          |
| 204  | No Content (Delete success)      |
| 400  | Bad Request                      |
| 401  | Unauthorized                     |
| 403  | Forbidden                        |
| 404  | Not Found                        |
| 429  | Too Many Requests (Rate Limited) |
| 500  | Internal Server Error            |

---

## 🔧 Error Response Format

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 📦 File Upload

- **Supported formats**: jpg, jpeg, png, webp
- **Max file size**: 5MB
- **Automatic conversion**: Images converted to WebP format
- **Storage**: MinIO object storage

---

## 🌐 CORS Configuration

Allowed origins (configured in .env):

```
ORIGIN_WHITELIST=http://localhost:3000,http://127.0.0.1:3000
```

Credentials: Enabled

---

## 🚀 Base URLs

**Development:**

- Local: `http://localhost:5000/api`
- LAN: `http://192.168.1.X:5000/api`

**Production:**

- Docker: `http://YOUR_SERVER_IP:5000/api`
- Domain: `https://api.yourdomain.com/api`

---

## 📚 Additional Resources

- [MongoDB URI Guide](./MONGO_URI_GUIDE.md)
- [Docker Port Mapping](./DOCKER_PORT_MAPPING.md)
- [MinIO Test Results](../test/MINIO_TEST_RESULTS.md)

---

**Last Updated**: November 5, 2025  
**API Version**: 1.0.0
