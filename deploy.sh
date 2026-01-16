#!/bin/bash
# FUTUROL App - Production Deployment Script
# Usage: ./deploy.sh
# 
# This script handles the full deployment cycle including:
# - Pulling latest code from Git
# - Cleanly stopping and removing existing app container
# - Building new Docker image
# - Starting fresh container
# - Auto-recovery on build failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting FUTUROL deployment..."

# Free up memory before build
echo "🧹 Cleaning up Docker resources to free memory..."
docker system prune -f 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

# Pull latest code (with stash for local changes)
echo "📥 Pulling latest changes..."
git stash 2>/dev/null || true
git pull origin main
git stash pop 2>/dev/null || true

# Stop and remove only the app container (keep DB running)
echo "🛑 Stopping app container..."
docker compose stop app 2>/dev/null || true
docker compose rm -f app 2>/dev/null || true

# Also force remove by name in case of orphans
docker rm -f futurol-app 2>/dev/null || true

# NOTE: Don't run 'docker compose down' - it removes the network and DB!

# Build new app image with retry logic
echo "🔨 Building new app image..."
BUILD_SUCCESS=false
set +e  # Disable exit on error for retry loop
for attempt in 1 2 3; do
    echo "Build attempt $attempt of 3..."
    if docker compose build app 2>&1; then
        BUILD_SUCCESS=true
        break
    else
        echo -e "${YELLOW}⚠️  Build attempt $attempt failed, cleaning up...${NC}"
        docker system prune -f 2>/dev/null || true
        docker builder prune -f 2>/dev/null || true
        sleep 5
    fi
done
set -e  # Re-enable exit on error

if [ "$BUILD_SUCCESS" = false ]; then
    echo -e "${RED}❌ Build failed after 3 attempts!${NC}"
    # Try to start with existing image if available
    if docker images | grep -q "futurol-app"; then
        echo -e "${YELLOW}⚠️  Attempting to start with existing image...${NC}"
        docker compose up -d
        exit 0
    fi
    exit 1
fi

# Start all services (DB will just stay running, app will start fresh)
echo "✅ Starting containers..."
docker compose up -d

# Verify containers are running
echo "🔍 Verifying containers..."
sleep 3
if ! docker compose ps | grep -q "futurol-app.*Up"; then
    echo -e "${YELLOW}⚠️  Container not running, attempting restart...${NC}"
    docker compose restart app
    sleep 5
fi

# Wait for health check
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check status
echo "📊 Container status:"
docker compose ps

# Show recent logs
echo "📋 Recent app logs:"
docker compose logs --tail=20 app

echo "✨ Deployment complete!"
