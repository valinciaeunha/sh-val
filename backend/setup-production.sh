#!/bin/bash
# ============================================
# ScriptHub.id Production Setup Script
# Auto-generates secure credentials
# ============================================

set -e

echo "🚀 ScriptHub.id Production Setup"
echo "================================="
echo ""

# ============================================
# Generate secure random values
# ============================================
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
PGADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

# ============================================
# Prompt for required values
# ============================================
read -p "🌐 Domain (e.g. api.scripthub.id): " API_DOMAIN
read -p "🌐 Frontend URL (e.g. https://scripthub.id): " FRONTEND_URL
read -p "🎮 Discord Client ID: " DISCORD_CLIENT_ID
read -p "🔑 Discord Client Secret: " DISCORD_CLIENT_SECRET
read -p "📦 S3 Endpoint: " S3_ENDPOINT
read -p "📦 S3 Access Key: " S3_ACCESS_KEY
read -p "📦 S3 Secret Key: " S3_SECRET_KEY
read -p "📦 S3 Images Bucket: " S3_BUCKET_IMAGES
read -p "📦 S3 Scripts Bucket: " S3_BUCKET_SCRIPTS
read -p "📦 S3 Region: " S3_REGION
read -p "📧 SMTP User (or press Enter to skip): " SMTP_USER
read -p "📧 SMTP Password: " SMTP_PASSWORD

# Defaults
API_URL="https://${API_DOMAIN}"
CORS_ORIGINS="${FRONTEND_URL},http://localhost:3000"

echo ""
echo "⚙️  Generating .env files..."

# ============================================
# Write backend/.env
# ============================================
cat > .env << EOF
# ============================================
# ScriptHub.id Production Configuration
# Auto-generated on $(date -u '+%Y-%m-%d %H:%M:%S UTC')
# ============================================

# Environment
NODE_ENV=production

# ============================================
# API Configuration
# ============================================
API_PORT=4000
API_URL=${API_URL}

# ============================================
# Frontend Configuration
# ============================================
FRONTEND_URL=${FRONTEND_URL}
APP_URL=${FRONTEND_URL}

# ============================================
# Database - PostgreSQL (AUTO-GENERATED)
# ============================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=scripthub
POSTGRES_USER=scripthub_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_SSL=false

DATABASE_URL=postgresql://scripthub_user:${POSTGRES_PASSWORD}@postgres:5432/scripthub

# ============================================
# Redis Configuration (AUTO-GENERATED)
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# ============================================
# JWT Authentication (AUTO-GENERATED)
# ============================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# Discord OAuth
# ============================================
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
DISCORD_CALLBACK_URL=${API_URL}/api/auth/discord/callback

# ============================================
# Email Configuration (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER:-noreply@scripthub.id}
SMTP_PASSWORD=${SMTP_PASSWORD:-changeme}
EMAIL_FROM=noreply@scripthub.id

# ============================================
# Security (AUTO-GENERATED)
# ============================================
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SESSION_SECRET=${SESSION_SECRET}
CORS_ORIGINS=${CORS_ORIGINS}

# ============================================
# PgAdmin
# ============================================
PGADMIN_PORT=5050
PGADMIN_EMAIL=admin@scripthub.id
PGADMIN_PASSWORD=${PGADMIN_PASSWORD}

# ============================================
# File Upload
# ============================================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ============================================
# S3 Configuration
# ============================================
S3_ENDPOINT=${S3_ENDPOINT}
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}
S3_BUCKET_IMAGES=${S3_BUCKET_IMAGES}
S3_BUCKET_SCRIPTS=${S3_BUCKET_SCRIPTS}
S3_REGION=${S3_REGION}

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
LOG_DIR=./logs

# ============================================
# Database Backup (S3)
# ============================================
S3_BACKUP_BUCKET=${S3_BUCKET_IMAGES}
S3_BACKUP_PREFIX=backups/db
BACKUP_RETENTION_DAYS=30
ENABLE_BACKUP=true
BACKUP_ON_STARTUP=false

# ============================================
# Feature Flags
# ============================================
ENABLE_EMAIL_VERIFICATION=true
ENABLE_DISCORD_LOGIN=true
ENABLE_REGISTRATION=true

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_AUTH_WINDOW=15
RATE_LIMIT_AUTH_MAX=30
RATE_LIMIT_API_WINDOW=15
RATE_LIMIT_API_MAX=500
EOF

# Copy to openapi
cp .env ../openapi/.env

echo ""
echo "✅ .env files generated!"
echo ""
echo "================================="
echo "🔐 AUTO-GENERATED CREDENTIALS"
echo "================================="
echo "PostgreSQL Password: ${POSTGRES_PASSWORD}"
echo "Redis Password:      ${REDIS_PASSWORD}"
echo "JWT Secret:          ${JWT_SECRET}"
echo "JWT Refresh Secret:  ${JWT_REFRESH_SECRET}"
echo "Session Secret:      ${SESSION_SECRET}"
echo "PgAdmin Password:    ${PGADMIN_PASSWORD}"
echo "================================="
echo ""
echo "⚠️  SAVE THESE CREDENTIALS SOMEWHERE SAFE!"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   docker compose down"
echo "   docker compose up -d --build"
echo ""
EOF
