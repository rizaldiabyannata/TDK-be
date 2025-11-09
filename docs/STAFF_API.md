# Staff API Documentation

## Overview

API untuk mengelola data staff/anggota tim dengan sistem level (tanpa hubungan parent-child hierarkis).

## Model Schema

```javascript
{
  name: String,              // Nama staff (required)
  position: String,          // Posisi/jabatan (required)
  short_description: String, // Deskripsi singkat (required)
  photoUrl: String,          // URL foto staff (required)
  socialMedia: [             // Array media sosial (optional)
    {
      platform: String,      // Nama platform (required jika ada)
      url: String           // URL media sosial (required jika ada)
    }
  ],
  level: Number,            // Level staff (required, min: 1)
  order: Number,            // Urutan tampilan (optional, default: 0)
  isActive: Boolean,        // Status aktif (optional, default: true)
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

### 1. Get All Staff

```
GET /api/staff
```

**Description:** Mendapatkan semua staff yang aktif, diurutkan berdasarkan level dan order.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6730a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "position": "CEO",
      "short_description": "Chief Executive Officer",
      "photoUrl": "/uploads/images/john-doe.webp",
      "socialMedia": [
        {
          "platform": "LinkedIn",
          "url": "https://linkedin.com/in/johndoe"
        }
      ],
      "level": 1,
      "order": 0,
      "isActive": true,
      "createdAt": "2024-11-10T00:00:00.000Z",
      "updatedAt": "2024-11-10T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Staff by Level

```
GET /api/staff/level/:level
```

**Description:** Mendapatkan staff berdasarkan level tertentu.

**Parameters:**

- `level` (path parameter): Level staff yang ingin diambil (contoh: 1, 2, 3)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6730a1b2c3d4e5f6a7b8c9d0",
      "name": "Jane Smith",
      "position": "Manager",
      "level": 2,
      "order": 0
    }
  ],
  "count": 1
}
```

---

### 3. Get Organizational Structure

```
GET /api/staff/structure
```

**Description:** Mendapatkan struktur organisasi lengkap yang dikelompokkan berdasarkan level.

**Response:**

```json
{
  "success": true,
  "data": {
    "1": [
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "position": "CEO",
        "level": 1,
        "order": 0
      }
    ],
    "2": [
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d1",
        "name": "Jane Smith",
        "position": "Manager",
        "level": 2,
        "order": 0
      },
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d2",
        "name": "Bob Johnson",
        "position": "Manager",
        "level": 2,
        "order": 1
      }
    ]
  },
  "count": 3,
  "levels": 2
}
```

---

### 4. Get Staff by ID

```
GET /api/staff/:id
```

**Description:** Mendapatkan detail staff berdasarkan ID.

**Parameters:**

- `id` (path parameter): MongoDB ObjectId staff

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "6730a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "position": "CEO",
    "short_description": "Chief Executive Officer",
    "photoUrl": "/uploads/images/john-doe.webp",
    "socialMedia": [
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/johndoe"
      }
    ],
    "level": 1,
    "order": 0,
    "isActive": true,
    "createdAt": "2024-11-10T00:00:00.000Z",
    "updatedAt": "2024-11-10T00:00:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Staff not found"
}
```

---

### 5. Create Staff

```
POST /api/staff
```

**Description:** Membuat staff baru.

**Authentication:** Required (JWT Token)

**Content-Type:** `multipart/form-data`

**Body Parameters:**

- `name` (required): Nama staff
- `position` (required): Posisi/jabatan
- `short_description` (required): Deskripsi singkat
- `photo` (required, file): File foto staff (akan dikonversi ke WebP)
- `level` (required, number): Level staff (minimal 1)
- `order` (optional, number): Urutan tampilan (default: 0)
- `socialMedia` (optional, JSON string): Array media sosial
  ```json
  [
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/username"
    }
  ]
  ```

**Example Request (using FormData):**

```javascript
const formData = new FormData();
formData.append("name", "John Doe");
formData.append("position", "CEO");
formData.append("short_description", "Chief Executive Officer");
formData.append("level", "1");
formData.append("order", "0");
formData.append("photo", photoFile);
formData.append(
  "socialMedia",
  JSON.stringify([
    { platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
  ])
);
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "6730a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "position": "CEO",
    "short_description": "Chief Executive Officer",
    "photoUrl": "/uploads/images/john-doe-1699574400000.webp",
    "socialMedia": [
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/johndoe"
      }
    ],
    "level": 1,
    "order": 0,
    "isActive": true,
    "createdAt": "2024-11-10T00:00:00.000Z",
    "updatedAt": "2024-11-10T00:00:00.000Z"
  }
}
```

---

### 6. Update Staff

```
PUT /api/staff/:id
```

**Description:** Mengupdate data staff.

**Authentication:** Required (JWT Token)

**Content-Type:** `multipart/form-data`

**Parameters:**

- `id` (path parameter): MongoDB ObjectId staff

**Body Parameters (semua optional):**

- `name`: Nama staff
- `position`: Posisi/jabatan
- `short_description`: Deskripsi singkat
- `photo` (file): File foto staff baru (akan replace foto lama)
- `level` (number): Level staff
- `order` (number): Urutan tampilan
- `socialMedia` (JSON string): Array media sosial
- `isActive` (boolean): Status aktif

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "6730a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe Updated",
    "position": "CEO",
    "level": 1,
    "order": 0
  }
}
```

---

### 7. Toggle Staff Status

```
PATCH /api/staff/:staffId/status
```

**Description:** Mengaktifkan atau menonaktifkan staff.

**Authentication:** Required (JWT Token)

**Parameters:**

- `staffId` (path parameter): MongoDB ObjectId staff

**Body:**

```json
{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Staff dinonaktifkan",
  "data": {
    "_id": "6730a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "isActive": false
  }
}
```

---

### 8. Delete Staff

```
DELETE /api/staff/:id
```

**Description:** Menghapus staff (akan menghapus foto juga).

**Authentication:** Required (JWT Token)

**Parameters:**

- `id` (path parameter): MongoDB ObjectId staff

**Response:**

```json
{
  "success": true,
  "message": "Staff berhasil dihapus",
  "data": {
    "_id": "6730a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "position": "CEO"
  }
}
```

---

## Level System

Staff dikelompokkan berdasarkan **level** numerik:

- **Level 1**: Biasanya untuk posisi tertinggi (CEO, Founder, dll)
- **Level 2**: Manajemen tingkat atas (VP, Director, dll)
- **Level 3**: Manajemen tingkat menengah (Manager, dll)
- **Level 4+**: Staff dan posisi lainnya

### Contoh Struktur:

```
Level 1: CEO
Level 2: CTO, CFO, COO
Level 3: Engineering Manager, Finance Manager, Operations Manager
Level 4: Senior Developer, Accountant, Operations Staff
```

Tidak ada hubungan parent-child, sehingga semua staff di level yang sama setara.

## Order Field

Field `order` digunakan untuk mengurutkan staff dalam level yang sama:

- Staff dengan `order` lebih kecil akan ditampilkan lebih dulu
- Jika tidak diisi, default adalah 0
- Berguna untuk mengatur urutan tampilan dalam level yang sama

**Example:**

```
Level 2:
  - CTO (order: 0)
  - CFO (order: 1)
  - COO (order: 2)
```

## Error Responses

### 400 Bad Request

```json
{
  "errors": [
    {
      "field": "level",
      "message": "Level wajib diisi dan harus berupa angka positif minimal 1"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "message": "Staff not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

## Notes

1. **File Upload**: Foto akan otomatis dikonversi ke format WebP untuk optimasi
2. **Authentication**: Endpoint POST, PUT, PATCH, dan DELETE memerlukan JWT token
3. **Level Validation**: Level minimal adalah 1
4. **Order Validation**: Order minimal adalah 0
5. **Social Media**: Field socialMedia bersifat optional, bisa kosong atau berisi array platform dan URL
