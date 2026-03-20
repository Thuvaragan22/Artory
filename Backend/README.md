# 🎨 Art Platform Backend API v2.0

Full-featured Express.js REST API with Authentication & Authorization.

## 📁 Project Structure

```
Backend/
├── config/
│   ├── db.js                  # MySQL connection pool
│   └── passport.js            # Google OAuth strategy
├── controllers/
│   └── authController.js      # All auth logic
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   ├── roleMiddleware.js      # RBAC enforcement
│   ├── validateRequest.js     # Joi validation middleware
│   ├── rateLimiter.js         # Rate limiting
│   └── errorHandler.js        # Global error handler
├── routes/
│   └── authRoutes.js          # Auth endpoint definitions
├── utils/
│   ├── generateToken.js       # JWT generator
│   ├── apiResponse.js         # Standardized responses
│   ├── sendEmail.js           # Nodemailer email sender
│   └── validators.js          # Joi schemas
├── database_migration.sql     # DB schema changes
├── .env.example               # Environment variable template
├── server.js                  # App entry point
└── package.json
```

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run database migration
```sql
-- Run database_migration.sql in your MySQL client
```

### 4. Start server
```bash
npm run dev     # Development (nodemon)
npm start       # Production
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Auth Routes `/api/v1/auth`

| Method | Endpoint                  | Auth Required | Description               |
|--------|---------------------------|---------------|---------------------------|
| POST   | `/register`               | No            | Register new user         |
| POST   | `/login`                  | No            | Login with email/password |
| POST   | `/logout`                 | No            | Logout & invalidate token |
| POST   | `/refresh-token`          | No            | Rotate access token       |
| POST   | `/forgot-password`        | No            | Send reset email          |
| POST   | `/reset-password`         | No            | Reset password via token  |
| GET    | `/google`                 | No            | Initiate Google OAuth     |
| GET    | `/google/callback`        | No            | Google OAuth callback     |
| GET    | `/me`                     | ✅ Bearer     | Get current user profile  |

### Protected Routes

| Method | Endpoint                     | Role Required    |
|--------|------------------------------|------------------|
| GET    | `/admin/dashboard`           | admin            |
| GET    | `/learner/dashboard`         | learner, admin   |
| GET    | `/guide/dashboard`           | guide, admin     |

---

## 📝 Request & Response Examples

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "role": "learner"
}
```
**Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "userId": 1 }
}
```

---

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password@123"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "John Doe",
      "email": "john@example.com",
      "role": "learner"
    }
  }
}
```

---

### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "If that email is registered, you will receive a password reset link."
}
```

---

### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "abc123tokenFromEmail",
  "password": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

---

### Refresh Token
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

---

### Google OAuth
```
GET /api/v1/auth/google
→ Redirects to Google login page

After success:
→ Redirects to: CLIENT_URL/auth/success?accessToken=...&refreshToken=...

After failure:
→ Redirects to: CLIENT_URL/auth/error?message=...
```

---

## 🔐 Security Features

- ✅ **bcrypt** password hashing (cost factor 12)
- ✅ **JWT** access tokens (15min expiry)
- ✅ **Refresh token rotation** (stored in DB, invalidated on logout)
- ✅ **Rate limiting** (10 auth attempts / 15min; 5 forgot-password / hour)
- ✅ **Joi validation** on all request bodies
- ✅ **RBAC** — admin / learner / guide roles
- ✅ **Centralized error handling** middleware
- ✅ **No sensitive data** in responses (no password, no raw tokens)
- ✅ **Email enumeration prevention** on forgot-password
- ✅ **Hashed reset tokens** stored in DB (SHA-256)
- ✅ **Google OAuth 2.0** (passport-google-oauth20)
- ✅ **Standardized API response format** across all endpoints

---

## ⚙️ Environment Variables

| Variable                  | Description                          | Example                        |
|---------------------------|--------------------------------------|--------------------------------|
| `PORT`                    | Server port                          | `5000`                         |
| `DB_HOST`                 | MySQL host                           | `localhost`                    |
| `DB_USER`                 | MySQL username                       | `root`                         |
| `DB_PASSWORD`             | MySQL password                       | `your_password`                |
| `DB_NAME`                 | MySQL database name                  | `art_platform`                 |
| `JWT_SECRET`              | Access token secret                  | `random_long_string`           |
| `JWT_REFRESH_SECRET`      | Refresh token secret                 | `another_random_string`        |
| `JWT_EXPIRES_IN`          | Access token expiry                  | `15m`                          |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token expiry                 | `7d`                           |
| `EMAIL_HOST`              | SMTP host                            | `smtp.gmail.com`               |
| `EMAIL_PORT`              | SMTP port                            | `587`                          |
| `EMAIL_USER`              | SMTP email                           | `you@gmail.com`                |
| `EMAIL_PASS`              | SMTP app password                    | `gmail_app_password`           |
| `EMAIL_FROM`              | From header                          | `Art Platform <you@gmail.com>` |
| `GOOGLE_CLIENT_ID`        | Google OAuth Client ID               | From Google Console            |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth Client Secret           | From Google Console            |
| `GOOGLE_CALLBACK_URL`     | Google redirect URI                  | `/api/v1/auth/google/callback` |
| `CLIENT_URL`              | Frontend URL                         | `http://localhost:3000`        |
| `RESET_TOKEN_EXPIRES_IN`  | Reset token lifetime (minutes)       | `10`                           |

---

## 📦 Dependencies

| Package                  | Purpose                       |
|--------------------------|-------------------------------|
| express                  | Web framework                 |
| bcryptjs                 | Password hashing              |
| jsonwebtoken             | JWT auth                      |
| mysql2                   | MySQL client                  |
| joi                      | Request validation            |
| nodemailer               | Email sending                 |
| passport                 | OAuth middleware              |
| passport-google-oauth20  | Google OAuth strategy         |
| express-rate-limit       | API rate limiting             |
| dotenv                   | Environment variables         |
| cors                     | Cross-origin resource sharing |
