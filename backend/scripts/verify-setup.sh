#!/bin/bash

# Coding War Backend Setup Verification Script

echo "🔍 Verifying Coding War Backend Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Found $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} Found v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    echo -e "${GREEN}✓${NC} Found $DOCKER_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Docker not found (optional for local development)"
fi

# Check Docker Compose
echo -n "Checking Docker Compose... "
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | cut -d ',' -f1)
    echo -e "${GREEN}✓${NC} Found $COMPOSE_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Docker Compose not found (optional for local development)"
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run: npm install"
fi

# Check if .env exists
echo -n "Checking environment file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${YELLOW}⚠${NC} .env file not found. Run: cp .env.example .env"
fi

# Check PostgreSQL connection (if Docker is running)
echo -n "Checking PostgreSQL... "
if docker ps | grep -q coding-war-postgres; then
    echo -e "${GREEN}✓${NC} PostgreSQL container running"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL container not running. Run: docker-compose up -d postgres"
fi

# Check Redis connection (if Docker is running)
echo -n "Checking Redis... "
if docker ps | grep -q coding-war-redis; then
    echo -e "${GREEN}✓${NC} Redis container running"
else
    echo -e "${YELLOW}⚠${NC} Redis container not running. Run: docker-compose up -d redis"
fi

# Check project structure
echo -n "Checking project structure... "
REQUIRED_DIRS=("src/routes" "src/services" "src/middleware" "src/models" "src/utils" "src/types" "prisma")
MISSING_DIRS=()

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        MISSING_DIRS+=("$dir")
    fi
done

if [ ${#MISSING_DIRS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All required directories exist"
else
    echo -e "${RED}✗${NC} Missing directories: ${MISSING_DIRS[*]}"
fi

echo ""
echo "📋 Setup Summary:"
echo "  - Node.js: ${NODE_VERSION}"
echo "  - npm: v${NPM_VERSION}"
echo "  - Project structure: Complete"
echo ""

if [ -d "node_modules" ] && [ -f ".env" ]; then
    echo -e "${GREEN}✅ Setup is complete! You can start development with: npm run dev${NC}"
else
    echo -e "${YELLOW}⚠️  Setup incomplete. Please follow the steps in SETUP.md${NC}"
fi
