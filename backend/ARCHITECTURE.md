# 🏗️ ScriptHub.id Backend Architecture

## 📋 Overview

ScriptHub.id backend is built with **Clean Architecture** principles, ensuring separation of concerns, testability, and scalability. The system is designed to handle authentication, authorization, and content management for a script-sharing platform.

---

## 🎯 Design Principles

### 1. **Clean Architecture**
- **Independence**: Business logic independent of frameworks
- **Testability**: Core logic can be tested without external dependencies
- **Flexibility**: Easy to swap databases, frameworks, or UI

### 2. **SOLID Principles**
- **Single Responsibility**: Each module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Dependency Inversion**: Depend on abstractions, not concretions

### 3. **Security First**
- Defense in depth
- Least privilege access
- Input validation at all layers
- Audit logging for critical actions

---

## 🧩 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (Next.js 14 + React)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│            (Express.js + Middleware Layer)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Rate Limiting │ CORS │ Helmet │ Auth │ Validation   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   Auth   │  │  Users   │  │  Scripts │
│  Module  │  │  Module  │  │  Module  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     └─────────────┼──────────────┘
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
┌──────────┐              ┌──────────┐
│PostgreSQL│              │  Redis   │
│(Primary) │              │ (Cache)  │
└──────────┘              └──────────┘
```

---

## 📦 Layer Architecture

### **1. Presentation Layer** (Routes & Controllers)
- HTTP request handling
- Input validation
- Response formatting
- Route definitions

**Responsibilities:**
- Parse HTTP requests
- Validate input format
- Call service layer
- Format responses

**Files:**
```
src/routes/
src/modules/*/controllers/
```

### **2. Business Logic Layer** (Services)
- Core business rules
- Data transformation
- Complex operations
- Integration orchestration

**Responsibilities:**
- Implement business rules
- Coordinate between modules
- Handle transactions
- Error handling

**Files:**
```
src/modules/*/services/
src/services/
```

### **3. Data Access Layer** (Database)
- Database queries
- Data mapping
- Connection management

**Responsibilities:**
- CRUD operations
- Query optimization
- Connection pooling
- Transaction management

**Files:**
```
src/db/
```

### **4. Infrastructure Layer**
- External services
- File storage
- Email sending
- OAuth providers

**Files:**
```
src/utils/
src/config/
```

---

## 🔐 Authentication & Authorization Flow

### Authentication Flow

```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate Access Token (JWT)
   ↓
4. Generate Refresh Token
   ↓
5. Store Refresh Token in Redis
   ↓
6. Return Tokens to Client
   ↓
7. Client Stores Tokens
   ↓
8. Subsequent Requests Include Access Token
   ↓
9. Middleware Verifies Token
   ↓
10. Request Proceeds if Valid
```

### Authorization (RBAC) Flow

```
1. Authenticated Request
   ↓
2. Extract User ID from JWT
   ↓
3. Load User Roles from Cache/DB
   ↓
4. Load Role Permissions
   ↓
5. Check Required Permission
   ↓
6. Allow/Deny Access
   ↓
7. Log Access Attempt (Audit)
```

### Multi-Provider Authentication

```
User Account
    ├── Email/Password (auth_providers: email)
    ├── Discord OAuth (auth_providers: discord)
    ├── Google OAuth (auth_providers: google)
    └── GitHub OAuth (auth_providers: github)

One user can link multiple providers!
```

---

## 🗄️ Database Design

### Entity Relationships

```
┌─────────────────────────────────────────────────────────┐
│                   RBAC System                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐       ┌────────────┐       ┌────────────┐│
│  │  users  │◄──────┤user_roles  │──────►│   roles    ││
│  └─────────┘       └────────────┘       └──────┬─────┘│
│       ▲                                         │      │
│       │                                         │      │
│       │            ┌────────────┐               │      │
│       │            │   role_    │               │      │
│       │            │permissions │◄──────────────┘      │
│       │            └──────┬─────┘                      │
│       │                   │                            │
│       │                   ▼                            │
│       │            ┌────────────┐                      │
│       │            │permissions │                      │
│       │            └────────────┘                      │
│       │                                                │
│       │            ┌────────────┐                      │
│       └────────────┤   auth_    │                      │
│                    │ providers  │                      │
│                    └────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. UUID Primary Keys**
- Distributed system friendly
- No sequential enumeration
- Better security (no ID guessing)

**2. Soft Deletes**
- `account_status = 'deleted'`
- Preserve data integrity
- Allow recovery
- Maintain audit trail

**3. Timestamps Everywhere**
- `created_at` - Creation time
- `updated_at` - Last modification
- Auto-updated via triggers

**4. JSONB for Flexibility**
- `provider_data` in auth_providers
- `metadata` in audit_logs
- Flexible schema evolution

**5. Proper Indexing**
- Foreign keys indexed
- Lookup columns indexed
- Composite indexes for common queries

---

## 🔄 Data Flow Examples

### Example 1: User Registration

```
POST /api/auth/register
    ↓
[Validation Middleware]
    ↓
[Rate Limit Check]
    ↓
[Auth Controller]
    ↓
[Auth Service]
    ├─ Hash password (bcrypt)
    ├─ Create user record
    ├─ Assign default role (user)
    ├─ Create auth_provider (email)
    ├─ Generate verification token
    └─ Send verification email
    ↓
[Response]
    ↓
201 Created + { user, token }
```

### Example 2: Discord OAuth Login

```
GET /api/auth/discord
    ↓
[Redirect to Discord]
    ↓
[User Authorizes]
    ↓
GET /api/auth/discord/callback?code=xxx
    ↓
[Exchange code for tokens]
    ↓
[Fetch Discord user info]
    ↓
[Check if user exists]
    ├─ Exists? Link provider
    └─ New? Create user + link provider
    ↓
[Generate JWT tokens]
    ↓
[Redirect to frontend with token]
```

### Example 3: Protected Route Access

```
GET /api/scripts/create
Authorization: Bearer <token>
    ↓
[Auth Middleware]
    ├─ Extract token
    ├─ Verify signature
    ├─ Check expiration
    └─ Load user data
    ↓
[RBAC Middleware]
    ├─ Load user roles
    ├─ Load role permissions
    ├─ Check 'scripts.create'
    └─ Allow/Deny
    ↓
[Controller]
    ↓
[Service]
    ↓
[Database]
    ↓
[Response]
```

---

## 🚀 Performance Optimizations

### 1. **Caching Strategy**

```javascript
// User permissions cached in Redis
GET /api/protected-route
    ↓
Redis: Check user:{userId}:permissions
    ├─ Cache Hit? → Use cached permissions
    └─ Cache Miss? → Query DB → Cache result (TTL: 15min)
```

### 2. **Connection Pooling**

```javascript
// PostgreSQL connection pool
{
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

### 3. **Query Optimization**

- Proper indexes on foreign keys
- Composite indexes for common queries
- Avoid N+1 queries
- Use JOINs instead of multiple queries

### 4. **Rate Limiting**

```javascript
// Different limits for different endpoints
/api/auth/*    → 5 requests/15min
/api/*         → 100 requests/15min
```

---

## 🛡️ Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────┐
│         1. Network Layer                │
│  • Firewall rules                       │
│  • DDoS protection                      │
│  • SSL/TLS encryption                   │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         2. Application Layer            │
│  • Rate limiting                        │
│  • Helmet.js security headers           │
│  • CORS policy                          │
│  • Input validation                     │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         3. Authentication Layer         │
│  • JWT token validation                 │
│  • Session management                   │
│  • Password hashing (bcrypt)            │
│  • OAuth integration                    │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         4. Authorization Layer          │
│  • RBAC permission checking             │
│  • Resource ownership validation        │
│  • Audit logging                        │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         5. Data Layer                   │
│  • Parameterized queries (SQL injection)│
│  • Encrypted sensitive data             │
│  • Database access control              │
└─────────────────────────────────────────┘
```

### Security Measures

**Authentication:**
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT with expiry
- ✅ Refresh token rotation
- ✅ Session management
- ✅ Email verification

**Authorization:**
- ✅ RBAC with granular permissions
- ✅ Resource ownership validation
- ✅ Audit logging

**Input Validation:**
- ✅ express-validator
- ✅ Joi schema validation
- ✅ Type checking
- ✅ Sanitization

**Network Security:**
- ✅ HTTPS only in production
- ✅ Helmet.js security headers
- ✅ CORS whitelist
- ✅ Rate limiting

---

## 📊 Monitoring & Observability

### Logging Strategy

```
┌─────────────────────────────────────────┐
│         Application Logs                │
├─────────────────────────────────────────┤
│  • Error logs (Winston)                 │
│  • Access logs (Morgan)                 │
│  • Audit logs (Database)                │
│  • Performance metrics                  │
└─────────────────────────────────────────┘
```

### Log Levels

- **ERROR** - Critical errors requiring immediate attention
- **WARN** - Warning conditions
- **INFO** - Informational messages (default)
- **DEBUG** - Detailed debugging information
- **VERBOSE** - Very detailed logs

### Metrics to Track

1. **Performance**
   - Request latency (p50, p95, p99)
   - Throughput (requests/second)
   - Database query time
   - Cache hit/miss ratio

2. **Security**
   - Failed login attempts
   - Rate limit hits
   - Permission denials
   - Suspicious activities

3. **Business**
   - New user registrations
   - Active users
   - Script uploads
   - OAuth provider usage

---

## 🔧 Extensibility

### Adding New OAuth Provider (Example: GitHub)

```sql
-- 1. Add provider to enum (migration)
ALTER TABLE auth_providers 
  DROP CONSTRAINT auth_providers_provider_check;

ALTER TABLE auth_providers 
  ADD CONSTRAINT auth_providers_provider_check 
  CHECK (provider IN ('email', 'discord', 'google', 'github'));

-- 2. Add permission
INSERT INTO permissions (name, description, resource, action)
VALUES ('auth.github', 'Login with GitHub', 'auth', 'github');
```

```javascript
// 3. Add Passport strategy
import GitHubStrategy from 'passport-github2';

passport.use(new GitHubStrategy({
  clientID: config.github.clientId,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackUrl,
}, handleGitHubAuth));

// 4. Add routes
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', 
  passport.authenticate('github'), 
  handleCallback
);
```

### Adding New Role

```sql
-- Add new role
INSERT INTO roles (name, description)
VALUES ('premium_user', 'Premium user with additional features');

-- Assign permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'premium_user'),
  id
FROM permissions
WHERE name IN (
  'scripts.create',
  'scripts.read',
  'scripts.featured',  -- New permission
  'api.advanced'       -- New permission
);
```

### Adding New Permission

```sql
-- Add permission
INSERT INTO permissions (name, description, resource, action)
VALUES (
  'scripts.featured',
  'Create featured scripts',
  'scripts',
  'featured'
);

-- Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT id, (SELECT id FROM permissions WHERE name = 'scripts.featured')
FROM roles
WHERE name IN ('admin', 'premium_user');
```

---

## 🔄 Scalability Considerations

### Horizontal Scaling

```
         Load Balancer
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
  API-1    API-2    API-3
     │        │        │
     └────────┼────────┘
              │
     ┌────────┼────────┐
     ▼                 ▼
PostgreSQL          Redis
(Read Replicas)   (Cluster)
```

### Future Enhancements

1. **Database Sharding**
   - Shard by user_id
   - Geographical distribution

2. **Caching Layer**
   - Redis Cluster
   - CDN for static assets
   - Query result caching

3. **Message Queue**
   - RabbitMQ / Redis Queue
   - Async job processing
   - Email sending queue

4. **Microservices**
   - Auth service
   - User service
   - Script service
   - Notification service

---

## 📝 Best Practices

### Code Organization

```javascript
// ✅ Good: Single responsibility
class UserService {
  async createUser(data) { }
  async updateUser(id, data) { }
  async deleteUser(id) { }
}

// ❌ Bad: Multiple responsibilities
class UserService {
  async createUser(data) { }
  async sendEmail(to, subject) { }
  async uploadAvatar(file) { }
}
```

### Error Handling

```javascript
// ✅ Good: Specific error types
class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.statusCode = 404;
  }
}

// ✅ Good: Centralized error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.statusCode || 500).json({
    error: err.message
  });
});
```

### Database Queries

```javascript
// ✅ Good: Parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ Bad: String concatenation (SQL injection risk)
const user = await db.query(
  `SELECT * FROM users WHERE id = '${userId}'`
);
```

---

## 🎯 Design Decisions & Trade-offs

### 1. UUID vs Auto-increment IDs

**Choice:** UUID v4

**Pros:**
- No ID enumeration attacks
- Distributed system friendly
- Can generate client-side
- No conflicts in merges

**Cons:**
- Larger storage (16 bytes vs 4/8 bytes)
- Slightly slower joins
- Not human-readable

### 2. JWT vs Session-based Auth

**Choice:** JWT (with refresh tokens in Redis)

**Pros:**
- Stateless (scales horizontally)
- No database lookup per request
- Works across domains
- Mobile-friendly

**Cons:**
- Can't revoke immediately
- Larger payload than session ID
- Must manage refresh tokens

**Solution:** Hybrid approach with Redis for refresh tokens

### 3. RBAC vs ABAC

**Choice:** RBAC (with path to ABAC)

**Pros:**
- Simpler to implement
- Easier to understand
- Sufficient for most use cases
- Clear hierarchy

**Cons:**
- Less flexible than ABAC
- Can become complex with many roles

**Future:** Can evolve to ABAC by adding attribute checking

---

## 📚 References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [OWASP Security Guidelines](https://owasp.org/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** January 2024  
**Maintainer:** ScriptHub.id Team