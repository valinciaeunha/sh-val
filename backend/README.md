# 🚀 ScriptHub.id Backend API

Production-ready backend API with PostgreSQL, Redis, JWT authentication, Discord OAuth, and Role-Based Access Control (RBAC).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Authorization (RBAC)](#authorization-rbac)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)

---

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** - Secure access & refresh tokens
- 🎮 **Discord OAuth** - Social login integration
- 👥 **Role-Based Access Control (RBAC)** - Granular permissions system
- 📧 **Email Verification** - Secure account activation
- 🔄 **Multi-Provider Auth** - Link multiple auth methods to one account
- 📊 **Audit Logging** - Track all important actions
- ⚡ **Redis Caching** - Fast session & data caching
- 🛡️ **Rate Limiting** - DDoS protection
- 🔒 **Security Headers** - Helmet.js integration
- 📝 **Request Logging** - Morgan + Winston

### User Management
- User registration & login
- Email/password authentication
- Discord OAuth integration
- Email verification flow
- Password reset functionality
- Account status management (active/suspended/deleted)
- Profile management

### Authorization System
- **Roles**: Admin, User, Vendor, Moderator
- **Permissions**: Granular resource-action based
- **Dynamic**: Add roles/permissions without code changes
- **Scalable**: Ready for multi-tenant architecture

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js 20** | Runtime environment |
| **Express.js** | Web framework |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching & sessions |
| **Docker** | Containerization |
| **JWT** | Token-based auth |
| **Passport.js** | OAuth strategies |
| **bcryptjs** | Password hashing |
| **Winston** | Logging |
| **Helmet** | Security headers |
| **express-rate-limit** | Rate limiting |

---

## 🏗 Architecture

### Clean Architecture Layers

```
backend/
├── src/
│   ├── config/          # Configuration & env variables
│   ├── db/              # Database connection & migrations
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication logic
│   │   ├── users/       # User management
│   │   ├── roles/       # RBAC logic
│   │   └── ...
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── index.js         # Application entry point
├── db/
│   └── migrations/      # SQL migration files
├── uploads/             # File upload directory
├── logs/                # Application logs
├── docker-compose.yml   # Docker orchestration
├── Dockerfile          # API container
└── .env                # Environment variables
```

### Database Design

**RBAC Schema:**
```
users ←→ user_roles ←→ roles ←→ role_permissions ←→ permissions
```

**Multi-Auth:**
```
users ←→ auth_providers (email, discord, google, github)
```

---

## 📦 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 16+ (if running locally)
- Redis 7+ (if running locally)

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd backend
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```env
# Required
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Discord OAuth (optional)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check status
docker-compose ps
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## 📂 Project Structure

```
backend/
├── db/
│   └── migrations/
│       └── 001_init_schema.sql        # Initial database schema
│
├── src/
│   ├── config/
│   │   └── index.js                   # Configuration management
│   │
│   ├── db/
│   │   ├── index.js                   # PostgreSQL connection pool
│   │   └── redis.js                   # Redis client
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT verification
│   │   ├── rbac.js                    # Permission checks
│   │   ├── validation.js              # Request validation
│   │   ├── errorHandler.js            # Global error handler
│   │   └── rateLimit.js               # Rate limiting
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js     # Auth endpoints
│   │   │   ├── auth.service.js        # Auth business logic
│   │   │   └── auth.routes.js         # Auth routes
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   └── users.routes.js
│   │   │
│   │   └── roles/
│   │       ├── roles.controller.js
│   │       ├── roles.service.js
│   │       └── roles.routes.js
│   │
│   ├── routes/
│   │   └── index.js                   # Main router
│   │
│   ├── utils/
│   │   ├── jwt.js                     # JWT utilities
│   │   ├── logger.js                  # Winston logger
│   │   ├── validators.js              # Common validators
│   │   └── helpers.js                 # Helper functions
│   │
│   └── index.js                       # App entry point
│
├── uploads/                           # File uploads
├── logs/                              # Application logs
├── .env.example                       # Example environment variables
├── docker-compose.yml                 # Docker services
├── Dockerfile                         # API container
├── package.json                       # Dependencies
└── README.md                          # This file
```

---

## 🗄 Database Schema

### Core Tables

#### `users`
Main user accounts table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(255) | Email (nullable) |
| email_verified | BOOLEAN | Verification status |
| password_hash | VARCHAR(255) | Hashed password (nullable) |
| display_name | VARCHAR(100) | Display name |
| avatar_url | TEXT | Profile picture |
| account_status | VARCHAR(20) | active/suspended/deleted |
| created_at | TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | Last update |

#### `roles`
System roles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) | Role name (unique) |
| description | TEXT | Role description |

**Default Roles:**
- `admin` - Full system access
- `user` - Standard user permissions
- `vendor` - Hub owner permissions
- `moderator` - Content moderation

#### `permissions`
Granular permissions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Permission name (unique) |
| resource | VARCHAR(50) | Resource (users, scripts, hubs) |
| action | VARCHAR(50) | Action (create, read, update, delete) |

**Examples:**
- `scripts.create` - Upload scripts
- `scripts.verify` - Verify scripts
- `users.ban` - Ban users
- `hubs.manage` - Manage own hub

#### `user_roles`
User-Role mapping (many-to-many)

#### `role_permissions`
Role-Permission mapping (many-to-many)

#### `auth_providers`
OAuth provider linking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| provider | VARCHAR(50) | email/discord/google/github |
| provider_user_id | VARCHAR(255) | External user ID |
| access_token | TEXT | OAuth token |
| refresh_token | TEXT | OAuth refresh token |
| linked_at | TIMESTAMP | Link date |

### Supporting Tables

- `email_verifications` - Email verification tokens
- `password_resets` - Password reset tokens
- `sessions` - Refresh token storage
- `audit_logs` - Action tracking

---

## 🔌 API Endpoints

### Authentication

```http
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Email/password login
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Logout (invalidate token)
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with token
POST   /api/auth/verify-email       # Verify email with token
GET    /api/auth/discord            # Discord OAuth login
GET    /api/auth/discord/callback   # Discord OAuth callback
```

### Users

```http
GET    /api/users/me                # Get current user
PUT    /api/users/me                # Update current user
GET    /api/users/:id               # Get user by ID
PUT    /api/users/:id               # Update user (admin)
DELETE /api/users/:id               # Delete user (admin)
POST   /api/users/:id/ban           # Ban user (admin/moderator)
```

### Roles & Permissions

```http
GET    /api/roles                   # List all roles
GET    /api/roles/:id               # Get role details
POST   /api/roles                   # Create role (admin)
PUT    /api/roles/:id               # Update role (admin)
DELETE /api/roles/:id               # Delete role (admin)
GET    /api/permissions             # List permissions
```

### Health & Status

```http
GET    /health                      # Health check
GET    /api/status                  # System status
```

---

## 🔐 Authentication

### JWT Token Flow

1. **Login** → Receive access token + refresh token
2. **Access Token** → Short-lived (7 days), for API requests
3. **Refresh Token** → Long-lived (30 days), to get new access token
4. **Logout** → Invalidate refresh token

### Request Headers

```http
Authorization: Bearer <access_token>
```

### Token Payload

```json
{
  "userId": "uuid",
  "username": "user123",
  "email": "user@example.com",
  "roles": ["user"],
  "permissions": ["scripts.create", "scripts.read"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 🛡 Authorization (RBAC)

### Permission Checking

```javascript
// In your route
router.post('/scripts',
  authenticate,
  checkPermission('scripts.create'),
  createScript
);

// Or check multiple permissions
router.delete('/scripts/:id',
  authenticate,
  checkPermissions(['scripts.delete', 'admin.access'], 'any'),
  deleteScript
);
```

### Role Hierarchy

```
admin
├── All permissions
│
moderator
├── Content moderation
├── User management (limited)
│
vendor
├── Hub management (own)
├── Script management (own hub)
│
user
├── Script upload
├── Comments
└── Voting
```

### Adding New Permissions

```sql
-- Add permission
INSERT INTO permissions (name, description, resource, action)
VALUES ('scripts.feature', 'Feature scripts on homepage', 'scripts', 'feature');

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id)
VALUES (
  (SELECT id FROM roles WHERE name = 'admin'),
  (SELECT id FROM permissions WHERE name = 'scripts.feature')
);
```

---

## 🌍 Environment Variables

See `.env.example` for full list. Key variables:

### Required

```env
POSTGRES_PASSWORD=          # Database password
REDIS_PASSWORD=             # Redis password
JWT_SECRET=                 # JWT signing key
JWT_REFRESH_SECRET=         # Refresh token key
```

### Optional (but recommended)

```env
DISCORD_CLIENT_ID=          # Discord OAuth
DISCORD_CLIENT_SECRET=      # Discord OAuth secret
SMTP_HOST=                  # Email server
SMTP_USER=                  # Email username
SMTP_PASSWORD=              # Email password
```

### Generate Secrets

```bash
# JWT secrets
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 💻 Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL & Redis
docker-compose up -d postgres redis

# Run migrations
npm run migrate

# Start dev server
npm run dev
```

### Docker Development

```bash
# Start all services
docker-compose up

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f api

# Shell into API container
docker exec -it scripthub_api sh
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it scripthub_postgres psql -U scripthub_user -d scripthub

# Run migrations
docker exec -it scripthub_api npm run migrate

# Seed data
docker exec -it scripthub_api npm run seed
```

### PgAdmin Access

```bash
# Start PgAdmin
docker-compose --profile dev up -d pgadmin

# Access at http://localhost:5050
# Email: admin@scripthub.id
# Password: admin (from .env)
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable email verification
- [ ] Configure SMTP server
- [ ] Set up backup strategy
- [ ] Configure monitoring
- [ ] Set up log aggregation
- [ ] Review rate limits
- [ ] Enable security headers

### Docker Production

```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Setup

```bash
# Production environment
NODE_ENV=production

# Use managed services
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/scripthub
REDIS_URL=redis://:pass@prod-redis.example.com:6379

# Secure cookies
SESSION_COOKIE_SECURE=true
```

---

## 🔒 Security

### Implemented Security Features

✅ **Password Hashing** - bcrypt with 12 rounds
✅ **JWT Security** - Signed tokens with expiry
✅ **Rate Limiting** - Per endpoint & global
✅ **Helmet.js** - Security headers
✅ **CORS** - Whitelist origins
✅ **Input Validation** - express-validator
✅ **SQL Injection Prevention** - Parameterized queries
✅ **XSS Protection** - Content sanitization
✅ **CSRF Protection** - Token-based
✅ **Session Security** - Secure, httpOnly cookies
✅ **Audit Logging** - Track critical actions

### Best Practices

1. **Never commit `.env` file**
2. **Use strong secrets** (32+ characters random)
3. **Rotate JWT secrets periodically**
4. **Enable 2FA** (planned feature)
5. **Monitor failed login attempts**
6. **Regular security updates**
7. **Use managed databases in production**
8. **Enable backups**
9. **Implement rate limiting**
10. **Use HTTPS only**

---

## 📊 Monitoring & Logging

### Logs Location

```
logs/
├── combined.log          # All logs
├── error.log            # Error logs only
└── access.log           # HTTP access logs
```

### Log Levels

- `error` - Errors only
- `warn` - Warnings + errors
- `info` - General info (default)
- `debug` - Debug information
- `verbose` - Very detailed logs

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - see LICENSE file

---

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker exec -it scripthub_postgres pg_isready
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker exec -it scripthub_redis redis-cli ping
```

### Port Already in Use

```bash
# Change port in .env
API_PORT=3002
POSTGRES_PORT=5433
REDIS_PORT=6380
```

---

## 📞 Support

- 📧 Email: support@scripthub.id
- 💬 Discord: [Join Server](https://discord.gg/scripthub)
- 📖 Docs: [docs.scripthub.id](https://docs.scripthub.id)
- 🐛 Issues: [GitHub Issues](https://github.com/scripthub/backend/issues)

---

## 🎯 Roadmap

- [ ] WebSocket support for real-time notifications
- [ ] GraphQL API
- [ ] Two-Factor Authentication (2FA)
- [ ] API rate limiting per user tier
- [ ] Multi-tenant architecture
- [ ] Elasticsearch for search
- [ ] Microservices migration
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] API documentation (Swagger/OpenAPI)

---

**Built with ❤️ by the ScriptHub.id Team**