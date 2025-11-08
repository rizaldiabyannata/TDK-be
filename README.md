# Express.js API Boilerplate

<p align="center">
  <img src="https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker" alt="Docker" />
</p>

## ✨ About This Project

This is a backend boilerplate built with Express.js, MongoDB, and Redis. It provides a solid foundation for building modern web applications with features like user authentication, content management, and more.

## 🚀 Features

- **User Authentication**: Secure user registration, login, and session management using JWT.
- **Content Management**: CRUD functionality for blogs and portfolios.
- **Content Tracking**: Track views on blog posts and portfolio items.
- **Contact Form**: Save contact form submissions to the database.
- **Statistics Management**: Provides basic statistics about created content.
- **Security**: Comes with `helmet` to secure HTTP headers, `express-rate-limit` to prevent brute-force attacks, and `DOMPurify` for input sanitization.
- **Logging**: Uses `winston` and `morgan` for request and application activity logging.
- **Task Scheduling**: Utilizes `node-cron` for scheduled tasks like view synchronization.

## 🛠️ Tech Stack

- **Backend**: Express.js
- **Database**: MongoDB (with Mongoose)
- **Caching**: Redis
- **Authentication**: JSON Web Tokens (JWT)
- **Package Manager**: Bun
- **Other Key Libraries**:
  - `bcrypt`: For password hashing.
  - `cookie-parser`: For cookie management.
  - `cors`: To enable Cross-Origin Resource Sharing.
  - `dotenv`: For environment variable management.
  - `express-validator`: For input validation.
  - `helmet`: To secure the app by setting various HTTP headers.
  - `morgan`: For HTTP request logging.
  - `multer`: For handling file uploads.
  - `nodemailer`: For sending emails.
  - `sharp`: For image processing.
  - `slugify`: For creating SEO-friendly slugs.
  - `winston`: For logging.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/) (optional, for running with Docker)

## ⚙️ Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/TDK-GROUP/backend-express-tdk.git
   cd backend-express-tdk
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Create a `.env` file:**
   Copy the contents of `.env.example` (if it exists) or create a new `.env` file and add the necessary environment variables.
   ```env
   PORT=5000
   MONGO_URI=mongodb://mongo:27017/tdk-db
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin_password
   ```

## ▶️ How to Run

- **Development Mode:**

  ```bash
  bun run dev
  ```

  The application will run at `http://localhost:5000` and will automatically restart on file changes.

- **Production Mode:**
  To run the application in production mode, use the following command. This disables development-specific logging (like `console.log`) for better performance and security.

  ```bash
  BUN_ENV=production bun start
  ```

- **With Docker:**
  Ensure Docker is running, then execute the following command:
  ```bash
  docker-compose up --build
  ```
  The application will be accessible at `http://localhost:5000`.

## 🌐 CORS Configuration & Tunneling

This application supports cross-origin requests for development and production environments. The CORS configuration automatically allows:

- **Local Development**: `localhost` and `127.0.0.1` on any port (HTTP/HTTPS)
- **Local Network**: Private IP ranges (`192.168.x.x`, `10.x.x.x`)
- **Tunneling Services**: ngrok, localtunnel, and similar services (HTTP/HTTPS)
- **Production**: Whitelisted domains via `ORIGIN_WHITELIST` environment variable

### For Team Development with Tunneling

When working with teammates using different networks:

1. **Your colleague provides their public IP** (e.g., `192.168.1.100`)
2. **Add both HTTP and HTTPS versions** to your `.env` file:

   ```env
   ORIGIN_WHITELIST=http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,http://192.168.1.100:3000,https://192.168.1.100:3000
   ```

3. **If using tunneling services** (ngrok, etc.), set:

   ```env
   FORCE_HTTPS=true
   ```

4. **Restart the server** to apply CORS changes.

### Tunneling Setup Examples

- **ngrok**: `ngrok http 5000` → Add `https://abc123.ngrok.io` to whitelist
- **localtunnel**: `lt --port 5000` → Add the generated URL to whitelist
- **Cloudflare Tunnel**: Add the tunnel domain to whitelist

## 🧪 Testing

This project includes a basic smoke test to verify that the application server is running correctly after deployment.

To run the test, first ensure the application is running (e.g., with `docker-compose up`), then execute:

```bash
bun test
```

The script will ping the `/api/runtime` endpoint and exit with a success code if the server responds with a `200 OK`.

## 📂 Project Structure

```
.
├── config/             # Configuration (database, Redis)
├── controllers/        # Business logic for each route
├── middleware/         # Express middleware (auth, validation, etc.)
├── models/             # Mongoose schemas for MongoDB
├── routers/            # Express route definitions
├── services/           # Services (e.g., image processing)
├── utils/              # Utilities (logger, scheduler, etc.)
├── seeder/             # Seeders for initial data
├── test/               # Test files
├── index.js            # Main application entry point
└── package.json        # Project dependencies and scripts
```

## 🔌 API Endpoints

A detailed list of API endpoints can be found below:

### Authentication

- `POST /api/users/register`: Register a new user.
- `POST /api/users/login`: Log in a user.
- `POST /api/users/logout`: Log out a user.
- `POST /api/users/request-otp`: Request an OTP for password reset.
- `POST /api/users/verify-otp`: Verify the OTP.
- `POST /api/users/reset-password`: Reset the password.

### Blog

- `GET /api/blogs`: Get all blog posts.
- `GET /api/blogs/:slug`: Get a blog post by slug.
- `POST /api/blogs`: Create a new blog post (auth required).
- `PUT /api/blogs/:id`: Update a blog post (auth required).
- `DELETE /api/blogs/:id`: Delete a blog post (auth required).

### Portfolio

- `GET /api/portos`: Get all portfolio items.
- `GET /api/portos/:slug`: Get a portfolio item by slug.
- `POST /api/portos`: Create a new portfolio item (auth required).
- `PUT /api/portos/:id`: Update a portfolio item (auth required).
- `DELETE /api/portos/:id`: Delete a portfolio item (auth required).

### Contact Form

- `POST /api/contact`: Submit a contact form.
- `GET /api/contact`: Get all contact form submissions (auth required).

### Statistics

- `GET /api/statistics`: Get content statistics (auth required).

## 📄 License

This project is licensed under the [MIT License](LICENSE).
