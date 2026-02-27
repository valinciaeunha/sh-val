# 🚀 ScriptHub.id Backend API Documentation

Complete API documentation for ScriptHub.id backend services.

---

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Endpoints](#endpoints)
  - [Health & Status](#health--status)
  - [Authentication](#authentication-endpoints)
  - [User Management](#user-management)
- [Examples](#examples)

---

## 🌐 Base URL

```
Development: http://localhost:4000
Production:  https://api.scripthub.id
```

---

## 🔐 Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### Request Header

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: Valid for 7 days
- **Refresh Token**: Valid for 30 days
- Refresh tokens are stored in httpOnly cookies

---

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": "ErrorType",
  "message": "Human readable error message",
  "details": [
    // Optional: Validation errors
  ]
}
```

---

## ⚠️ Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid/Missing Token) |
| 403 | Forbidden (Insufficient Permissions) |
| 404 | Not Found |
| 409 | Conflict (Duplicate Resource) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 📡 Endpoints

### Health & Status

#### Check System Health

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "uptime": 3600.5,
  "services": {
    "api": "running",
    "database": {
      "status": "connected",
      "poolSize": 1,
      "idleConnections": 1
    },
    "redis": {
      "status": "connected",
      "ping": "PONG"
    }
  }
}
```

#### API Ping

```http
GET /api/ping
```

**Response:**

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Authentication Endpoints

#### 1. Register New User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe"
}
```

**Validation Rules:**
- `username`: 3-50 characters, alphanumeric + underscore/hyphen
- `email`: Valid email format (optional)
- `password`: Min 8 characters, must contain uppercase, lowercase, and number
- `displayName`: 1-100 characters (optional)

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Errors:**
- 400: Validation error
- 409: Username/email already exists

---

#### 2. Login User

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "identifier": "johndoe",
  "password": "SecurePass123"
}
```

**Note:** `identifier` can be username or email.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "avatarUrl": null,
      "emailVerified": false,
      "roles": ["user"],
      "permissions": [
        "scripts.create",
        "scripts.read",
        "comments.create",
        "hubs.read"
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Sets Cookie:**
- `refreshToken` (httpOnly, secure in production)

**Errors:**
- 401: Invalid credentials
- 403: Account suspended/deleted

---

#### 3. Refresh Access Token

```http
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "refresh-token-string"
}
```

**Note:** Refresh token can also be sent via cookie.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token",
    "expiresIn": "7d"
  }
}
```

**Errors:**
- 401: Invalid/expired refresh token

---

#### 4. Logout User

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Clears Cookie:** `refreshToken`

---

#### 5. Logout from All Devices

```http
POST /api/auth/logout-all
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Note:** Revokes all refresh tokens for the user.

---

#### 6. Get Current User

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.png",
      "bio": "Developer and script enthusiast",
      "accountStatus": "active",
      "emailVerified": true,
      "roles": ["user"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Errors:**
- 401: Unauthorized (invalid token)

---

#### 7. Update User Profile

```http
PUT /api/auth/me
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "displayName": "John Doe Jr.",
  "bio": "Full stack developer",
  "avatarUrl": "https://example.com/new-avatar.png"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe Jr.",
      "avatarUrl": "https://example.com/new-avatar.png",
      "bio": "Full stack developer",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### 8. Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**Note:** All refresh tokens are revoked after password change.

**Errors:**
- 401: Current password incorrect
- 400: Cannot change password for social login accounts

---

#### 9. Verify Token

```http
GET /api/auth/verify
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "uuid-v4",
      "username": "johndoe",
      "email": "john@example.com",
      "roles": ["user"],
      "permissions": ["scripts.create", "scripts.read"]
    }
  }
}
```

**Errors:**
- 401: Invalid token

---

#### 10. Discord OAuth Login

```http
GET /api/auth/discord
```

**Description:** Redirects to Discord OAuth authorization page.

**Flow:**
1. User clicks "Login with Discord"
2. Redirected to Discord authorization page
3. User authorizes the application
4. Discord redirects to callback URL
5. Backend processes authentication
6. Redirects to frontend with tokens

---

#### 11. Discord OAuth Callback

```http
GET /api/auth/discord/callback
```

**Description:** Discord OAuth callback handler (internal use).

**Redirect:**
```
http://localhost:3000/auth/callback?token=<access_token>&refresh=<refresh_token>
```

**Error Redirect:**
```
http://localhost:3000/login?error=auth_failed
```

---

### User Management

#### Get User by ID

```http
GET /api/users/:userId
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.png",
      "bio": "Developer",
      "roles": ["user"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Errors:**
- 404: User not found

---

## 📚 Examples

### Example 1: Complete Registration & Login Flow

```bash
# 1. Register new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234",
    "displayName": "Test User"
  }'

# 2. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "Test1234"
  }'

# Response includes accessToken

# 3. Get current user profile
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

### Example 2: Update Profile

```bash
curl -X PUT http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "bio": "New bio description"
  }'
```

---

### Example 3: Refresh Token

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

---

## 🔒 RBAC (Role-Based Access Control)

### Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | Full system access | All permissions |
| **user** | Standard user | scripts.create, scripts.read, comments.create, hubs.read, votes.create |
| **vendor** | Hub owner | scripts.*, hubs.manage, comments.moderate |
| **moderator** | Content moderator | scripts.verify, scripts.moderate, users.ban, comments.moderate |

### Permission Format

Permissions follow the format: `resource.action`

**Examples:**
- `scripts.create` - Create scripts
- `scripts.read` - View scripts
- `scripts.verify` - Verify scripts (moderator+)
- `hubs.manage` - Manage own hub (vendor+)
- `users.ban` - Ban users (moderator+)
- `admin.access` - Access admin panel (admin only)

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# API
API_PORT=4000
API_URL=http://localhost:4000

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=scripthub
POSTGRES_USER=scripthub_user
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:4000/api/auth/discord/callback

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:4000/health
```

### API Ping

```bash
curl http://localhost:4000/api/ping
```

### Register & Login Test

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"Test1234"}'
```

---

## 📊 Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 5 requests / 15 minutes |
| General API | 100 requests / 15 minutes |

**Headers:**
- `X-RateLimit-Limit` - Maximum requests
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## 🚀 Future Endpoints (Planned)

### Scripts API
- `POST /api/scripts` - Upload script
- `GET /api/scripts` - List scripts
- `GET /api/scripts/:id` - Get script details
- `PUT /api/scripts/:id` - Update script
- `DELETE /api/scripts/:id` - Delete script

### Hubs API
- `GET /api/hubs` - List hubs
- `GET /api/hubs/:slug` - Get hub details
- `POST /api/hubs` - Create hub (vendor+)

### Comments API
- `POST /api/scripts/:id/comments` - Add comment
- `GET /api/scripts/:id/comments` - Get comments
- `DELETE /api/comments/:id` - Delete comment

---

## 📞 Support

- **Documentation**: [docs.scripthub.id](https://docs.scripthub.id)
- **Discord**: [Join Server](https://discord.gg/scripthub)
- **Email**: support@scripthub.id
- **GitHub**: [github.com/scripthub/backend](https://github.com/scripthub/backend)

---

**Version:** 1.0.0  
**Last Updated:** February 2024  
**Maintained by:** ScriptHub.id Team