#!/bin/bash

# ============================================
# ScriptHub.id Backend - Setup Script
# ============================================

set -e

echo "🚀 ScriptHub.id Backend Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker detected${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."

    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env and set your passwords and secrets!${NC}"
        echo ""

        # Generate random secrets
        echo "Generating random secrets..."

        if command -v openssl &> /dev/null; then
            JWT_SECRET=$(openssl rand -base64 32)
            JWT_REFRESH_SECRET=$(openssl rand -base64 32)
            SESSION_SECRET=$(openssl rand -base64 32)
            POSTGRES_PASSWORD=$(openssl rand -base64 16)
            REDIS_PASSWORD=$(openssl rand -base64 16)

            # Update .env with generated secrets
            sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
            sed -i.bak "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
            sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env
            sed -i.bak "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
            sed -i.bak "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" .env

            rm .env.bak

            echo -e "${GREEN}✅ Random secrets generated and saved to .env${NC}"
        else
            echo -e "${YELLOW}⚠️  OpenSSL not found. Please generate secrets manually.${NC}"
        fi

        echo ""
        read -p "Press Enter to continue after you've reviewed .env file..."
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""
echo "======================================"
echo "Starting Docker services..."
echo "======================================"
echo ""

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Build and start containers
echo ""
echo "Building and starting containers..."
docker-compose up -d --build

echo ""
echo "Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
until docker exec scripthub_postgres pg_isready -U scripthub_user > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}✅ Ready${NC}"

# Wait for Redis
echo -n "Waiting for Redis..."
until docker exec scripthub_redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}✅ Ready${NC}"

# Wait for API
echo -n "Waiting for API..."
until curl -f http://localhost:3001/health > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}✅ Ready${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Services running:"
echo -e "${BLUE}API:${NC}        http://localhost:3001"
echo -e "${BLUE}PostgreSQL:${NC} localhost:5432"
echo -e "${BLUE}Redis:${NC}      localhost:6379"
echo ""
echo "Useful commands:"
echo -e "${YELLOW}View logs:${NC}        docker-compose logs -f api"
echo -e "${YELLOW}Stop services:${NC}    docker-compose down"
echo -e "${YELLOW}Restart:${NC}          docker-compose restart"
echo -e "${YELLOW}View status:${NC}      docker-compose ps"
echo ""
echo "Database credentials (from .env):"
echo -e "${YELLOW}Database:${NC}  scripthub"
echo -e "${YELLOW}User:${NC}      scripthub_user"
echo -e "${YELLOW}Password:${NC}  (check your .env file)"
echo ""
echo "Next steps:"
echo "1. Test API: curl http://localhost:3001/health"
echo "2. View logs: docker-compose logs -f"
echo "3. Check README.md for API documentation"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
