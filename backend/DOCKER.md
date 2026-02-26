# 🐳 Docker Configuration Guide

## 📋 Overview

ScriptHub.id Backend menggunakan Docker Compose dengan **konfigurasi otomatis** dari file `.env`.

**Semua container akan otomatis membaca variabel dari file `.env`** - tidak perlu setting manual!

---

## 🏗️ Container Architecture

```
┌─────────────────────────────────────────────────┐
│           backend-scripthub                     │
│         (Node.js API Server)                    │
│              Port: 4000                         │
└──────────────┬──────────────┬───────────────────┘
               │              │
       ┌───────▼──────┐  ┌────▼──────────┐
       │  PostgreSQL  │  │     Redis     │
       │  Database    │  │     Cache     │
       │  Port: 5432  │  │  Port: 6379   │
       └──────────────┘  └───────────────┘
```

### Containers:
1. **backend-scripthub** - API Server (Node.js + Express)
2. **scripthub_postgres** - PostgreSQL 16 Database
3. **scripthub_redis** - Redis 7 Cache
4. **scripthub_pgadmin** - PgAdmin (Optional, hanya untuk development)

---

## ⚙️ Auto Configuration

### File Structure
```
backend/
├── .env                    # ← Konfigurasi UTAMA (auto-loaded)
├── .env.example            # Template
├── docker-compose.yml      # Orchestration
└── Dockerfile              # API container build
```

### Cara Kerja
1. Docker Compose **otomatis membaca** semua variabel dari `.env`
2. Semua container menggunakan `env_file: .env`
3. **Tidak ada hardcoded values** di docker-compose.yml
4. Tinggal edit `.env`, restart container, selesai!

---

## 🚀 Quick Start

### 1️⃣ Setup Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` sesuai kebutuhan (password, secrets, dll)

### 2️⃣ Start Containers

```bash
# Build dan start semua containers
docker-compose up -d --build

# Lihat logs
docker-compose logs -f

# Lihat status
docker-compose ps
```

### 3️⃣ Test API

```bash
# Health check
curl http://localhost:4000/health

# Test registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234",
    "displayName": "Test User"
  }'
```

---

## 🔧 Configuration (.env)

### Database Configuration
```env
POSTGRES_HOST=postgres           # Auto-resolved by Docker network
POSTGRES_PORT=5432
POSTGRES_DB=scripthub
POSTGRES_USER=scripthub_user
POSTGRES_PASSWORD=your-password  # ← CHANGE THIS!
```

### Redis Configuration
```env
REDIS_HOST=redis                 # Auto-resolved by Docker network
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-pass   # ← CHANGE THIS!
```

### JWT Secrets
```bash
# Generate secure secrets
openssl rand -base64 32

# Paste hasilnya ke .env
JWT_SECRET=generated-secret-here
JWT_REFRESH_SECRET=another-generated-secret
SESSION_SECRET=session-secret-here
```

### Discord OAuth (Optional)
```env
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_CALLBACK_URL=http://localhost:4000/api/auth/discord/callback
```

---

## 📝 Docker Commands

### Start/Stop
```bash
# Start (background mode)
docker-compose up -d

# Start dengan rebuild
docker-compose up -d --build

# Stop
docker-compose down

# Stop dan hapus volumes (reset database)
docker-compose down -v
```

### Logs
```bash
# Semua containers
docker-compose logs -f

# Specific container
docker logs backend-scripthub -f
docker logs scripthub_postgres -f
docker logs scripthub_redis -f

# Last 100 lines
docker logs backend-scripthub --tail 100
```

### Status & Health
```bash
# Check status
docker-compose ps

# Check health
curl http://localhost:4000/health

# Exec into container
docker exec -it backend-scripthub sh
docker exec -it scripthub_postgres psql -U scripthub_user -d scripthub
docker exec -it scripthub_redis redis-cli -a your-redis-password
```

### Database Management
```bash
# Connect to PostgreSQL
docker exec -it scripthub_postgres psql -U scripthub_user -d scripthub

# Run SQL file
docker exec -i scripthub_postgres psql -U scripthub_user -d scripthub < migration.sql

# Backup database
docker exec scripthub_postgres pg_dump -U scripthub_user scripthub > backup.sql

# Restore database
docker exec -i scripthub_postgres psql -U scripthub_user -d scripthub < backup.sql
```

---

## 🔄 Update Configuration

### Jika Mengubah `.env`:

```bash
# 1. Stop containers
docker-compose down

# 2. Edit .env file
nano .env  # atau text editor lainnya

# 3. Start ulang
docker-compose up -d
```

**PENTING:** Tidak perlu rebuild jika hanya ubah `.env`! Cukup restart.

### Jika Mengubah Code:

```bash
# Rebuild API container
docker-compose up -d --build backend-scripthub

# Atau rebuild semua
docker-compose up -d --build
```

---

## 🗄️ Database Migrations

Migration otomatis dijalankan saat container pertama kali start.

### Manual Migration:
```bash
# Taruh file SQL di backend/db/migrations/
# Format: XXX_description.sql (misal: 002_add_scripts_table.sql)

# Run manual
docker exec -i scripthub_postgres psql -U scripthub_user -d scripthub < db/migrations/002_add_scripts_table.sql
```

---

## 🧹 Cleanup & Reset

### Reset Everything (Fresh Start)
```bash
# Stop dan hapus semua (volumes, networks, images)
docker-compose down -v --rmi all

# Clean Docker system
docker system prune -af --volumes

# Start fresh
docker-compose up -d --build
```

### Reset Database Only
```bash
# Hapus volume PostgreSQL
docker-compose down
docker volume rm backend_postgres_data

# Start ulang (akan create fresh database)
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check port usage
netstat -ano | findstr :4000   # Windows
lsof -i :4000                   # Linux/Mac

# Kill process atau ubah port di .env:
API_PORT=4001
```

### Container Won't Start
```bash
# Check logs
docker logs backend-scripthub

# Check container details
docker inspect backend-scripthub

# Restart specific container
docker restart backend-scripthub
```

### Password Mismatch
Pastikan password di `.env` sama dengan yang digunakan container:
```bash
# Check environment variables in container
docker exec backend-scripthub env | grep POSTGRES

# Jika beda, stop, hapus volumes, start ulang
docker-compose down -v
docker-compose up -d
```

### Database Connection Failed
```bash
# Test PostgreSQL connection
docker exec scripthub_postgres pg_isready -U scripthub_user

# Check PostgreSQL logs
docker logs scripthub_postgres

# Manual test connection
docker exec -it scripthub_postgres psql -U scripthub_user -d scripthub
```

### Redis Connection Failed
```bash
# Test Redis connection
docker exec scripthub_redis redis-cli -a your-redis-password ping

# Check Redis logs
docker logs scripthub_redis
```

---

## 🔒 Security Best Practices

### 1. Strong Passwords
```bash
# Generate secure password (32 characters)
openssl rand -base64 32

# Use in .env
POSTGRES_PASSWORD=generated-password-here
REDIS_PASSWORD=another-generated-password
```

### 2. Secrets Management
```env
# Development (.env)
JWT_SECRET=dev-secret-change-in-production

# Production (use secrets manager)
# AWS Secrets Manager
# HashiCorp Vault
# Docker Secrets
```

### 3. Network Security
```yaml
# docker-compose.yml
networks:
  scripthub_network:
    driver: bridge
    # Internal network, tidak exposed ke luar
```

### 4. File Permissions
```bash
# Protect .env file
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

---

## 📊 Monitoring

### Health Checks
```bash
# API health
curl http://localhost:4000/health

# Database health
docker exec scripthub_postgres pg_isready

# Redis health
docker exec scripthub_redis redis-cli ping
```

### Resource Usage
```bash
# Check container stats
docker stats

# Specific container
docker stats backend-scripthub
```

### Logs Monitoring
```bash
# Real-time logs (all containers)
docker-compose logs -f

# Filter by service
docker-compose logs -f backend-scripthub

# Save logs to file
docker logs backend-scripthub > api.log 2>&1
```

---

## 🚀 Production Deployment

### Environment Differences
```env
# Development
NODE_ENV=development
LOG_LEVEL=debug

# Production
NODE_ENV=production
LOG_LEVEL=info
```

### Production Checklist
- [ ] Ubah semua passwords ke strong random values
- [ ] Generate new JWT secrets
- [ ] Configure SMTP untuk email
- [ ] Setup Discord OAuth production callback
- [ ] Enable HTTPS/SSL
- [ ] Setup reverse proxy (Nginx/Traefik)
- [ ] Configure backup strategy
- [ ] Setup monitoring & alerts
- [ ] Use Docker secrets instead of .env
- [ ] Enable rate limiting
- [ ] Setup firewall rules

### Docker Secrets (Production)
```yaml
# docker-compose.prod.yml
services:
  backend-scripthub:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

---

## 🎯 PgAdmin (Optional)

PgAdmin hanya untuk development. Aktifkan dengan profile `dev`:

```bash
# Start dengan PgAdmin
docker-compose --profile dev up -d

# Access PgAdmin
# URL: http://localhost:5050
# Email: admin@scripthub.id
# Password: admin (ubah di .env)
```

### Add Server in PgAdmin:
- **Name:** ScriptHub Local
- **Host:** postgres
- **Port:** 5432
- **Username:** scripthub_user
- **Password:** (dari .env POSTGRES_PASSWORD)

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 💡 Tips & Tricks

### 1. Auto-restart on crash
```yaml
services:
  backend-scripthub:
    restart: unless-stopped  # ✅ Already configured
```

### 2. Volume untuk development
```yaml
volumes:
  - ./src:/app/src:ro  # Read-only, auto-reload on change
```

### 3. Environment-specific compose files
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Backup automation
```bash
# Cron job untuk daily backup
0 2 * * * docker exec scripthub_postgres pg_dump -U scripthub_user scripthub > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## ✅ Summary

1. **Setup**: Copy `.env.example` → `.env` dan edit passwords
2. **Start**: `docker-compose up -d --build`
3. **Test**: `curl http://localhost:4000/health`
4. **Update Config**: Edit `.env` → `docker-compose down` → `docker-compose up -d`
5. **Reset**: `docker-compose down -v` → `docker-compose up -d`

**Semua konfigurasi ada di `.env` - tidak perlu edit docker-compose.yml!**

---

**Happy Dockerizing! 🐳**