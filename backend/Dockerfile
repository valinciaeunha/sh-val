# ============================================
# ScriptHub.id Backend - Dockerfile
# Multi-stage build for production optimization
# ============================================

# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    openssl \
    curl \
    postgresql16-client \
    aws-cli \
    bash \
    gzip \
    bc

# Set working directory
WORKDIR /app

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS dependencies

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm install --legacy-peer-deps

# ============================================
# Stage 3: Build
# ============================================
FROM dependencies AS build

# Copy source code
COPY . .

# No build step needed for plain JavaScript

# ============================================
# Stage 4: Development
# ============================================
FROM dependencies AS development

# Set NODE_ENV to development
ENV NODE_ENV=development

# Copy application code
COPY . .

# Copy backup scripts
RUN mkdir -p /scripts && chmod +x /app/scripts/*.sh 2>/dev/null || true

# Expose port
EXPOSE 4000

# Install nodemon globally to avoid path issues
RUN npm install -g nodemon

# Start with nodemon
CMD ["npm", "run", "dev"]

# ============================================
# Stage 5: Production
# ============================================
FROM base AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy application from build stage
COPY --from=build /app/src ./src
COPY --from=build /app/db ./db
COPY --from=build /app/package.json ./package.json

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${API_PORT:-4000}/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
