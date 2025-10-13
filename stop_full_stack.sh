#!/bin/bash

# Yacht Sentinel AI - Stop Full Development Stack
# Stops all running services cleanly

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Stopping All Services          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop Docker containers
echo -e "${BLUE}🐳 Stopping Docker containers...${NC}"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
docker ps -q | xargs docker stop 2>/dev/null || true
echo -e "${GREEN}✅ Docker containers stopped${NC}"

# Stop Supabase (including Docker containers)
echo -e "${BLUE}🛑 Stopping Supabase...${NC}"
npx supabase stop 2>/dev/null || true
cd "$(dirname "$0")" && npx supabase stop 2>/dev/null || true
echo -e "${GREEN}✅ Supabase stopped${NC}"

# Stop Vite dev server (ports 5173 and 5174)
echo -e "${BLUE}🛑 Stopping Vite dev server...${NC}"
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo -e "${GREEN}✅ Vite stopped${NC}"

# Stop Supabase port (54321)
echo -e "${BLUE}🛑 Stopping Supabase port 54321...${NC}"
lsof -ti:54321 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ Supabase port cleared${NC}"

# Stop any remaining Node processes
echo -e "${BLUE}🛑 Stopping Node processes...${NC}"
pkill -f "node.*yacht-sentinel" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
echo -e "${GREEN}✅ Node processes stopped${NC}"

# Stop npm processes
echo -e "${BLUE}🛑 Stopping npm processes...${NC}"
pkill -f "npm" 2>/dev/null || true
echo -e "${GREEN}✅ npm processes stopped${NC}"

# Clean up any orphaned processes
echo -e "${BLUE}🧹 Cleaning up orphaned processes...${NC}"
ps aux | grep -E "(supabase|vite|yacht-sentinel|docker)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ ALL SERVICES STOPPED                               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 To start services again, run:${NC} ./start_full_stack.sh"
echo ""
