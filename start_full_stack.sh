#!/bin/bash

# Yacht Sentinel AI - Full Development Stack Startup Script
# This script ensures the complete backup is restored and all services start properly

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Full Stack Startup             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
BACKUP_DIR="./supabase_backups"
COMPLETE_BACKUP="yacht_sentinel_20251011_024733_COMPLETE.dump"
BACKUP_PATH="$BACKUP_DIR/$COMPLETE_BACKUP"

# Supabase local DB connection
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Step 1: Check if backup exists
echo -e "${BLUE}📦 Checking for complete backup...${NC}"
if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Complete backup not found: $BACKUP_PATH${NC}"
    echo -e "${YELLOW}Expected backup with 70+ tables, edge functions, RLS policies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Found complete backup: $COMPLETE_BACKUP${NC}"
echo ""

# Step 2: Stop any running services
echo -e "${BLUE}🛑 Stopping any running services...${NC}"
npx supabase stop 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# Step 3: Start Supabase
echo -e "${BLUE}🚀 Starting Supabase...${NC}"
npx supabase start
echo -e "${GREEN}✅ Supabase started${NC}"
echo ""

# Wait for Supabase to be ready
echo -e "${BLUE}⏳ Waiting for Supabase to be ready...${NC}"
sleep 5

# Step 4: Check if database needs restoration
echo -e "${BLUE}🔍 Checking database state...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)  # Trim whitespace

echo -e "${YELLOW}📊 Current table count: $TABLE_COUNT${NC}"

if [ "$TABLE_COUNT" -lt 15 ]; then
    echo -e "${YELLOW}⚠️  Database has less than 15 tables - restoring from backup...${NC}"
    echo ""
    
    # Terminate existing connections
    echo -e "${BLUE}🔄 Terminating existing database connections...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
    " 2>/dev/null || true
    
    # Restore from backup
    echo -e "${BLUE}🔄 Restoring database from complete backup...${NC}"
    echo -e "${YELLOW}   (This includes 70+ tables, edge functions, RLS policies, RPC functions)${NC}"
    PGPASSWORD=$DB_PASSWORD pg_restore \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        "$BACKUP_PATH" 2>&1 | grep -v "NOTICE\|WARNING" || true
    
    echo -e "${GREEN}✅ Database restored from backup${NC}"
    echo ""
    
    # Verify restoration
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    TABLE_COUNT=$(echo $TABLE_COUNT | xargs)
    echo -e "${GREEN}✅ Database now has $TABLE_COUNT tables${NC}"
    
    # Restore superadmin account
    echo -e "${BLUE}🔑 Ensuring superadmin account exists...${NC}"
    if [ -f "./restore_superadmin.sh" ]; then
        bash ./restore_superadmin.sh
    else
        echo -e "${YELLOW}⚠️  restore_superadmin.sh not found - skipping${NC}"
    fi
    echo ""
else
    echo -e "${GREEN}✅ Database already has $TABLE_COUNT tables - skipping restoration${NC}"
    echo ""
fi

# Step 5: Start Frontend
echo -e "${BLUE}🌐 Starting Frontend Development Server...${NC}"
echo -e "${YELLOW}   Frontend will start on http://localhost:5174${NC}"
echo ""

# Start in background
npm run dev &
VITE_PID=$!

# Wait for frontend to start
echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Check if Vite is running
if ps -p $VITE_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend started successfully${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

# Step 6: Display status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ FULL DEVELOPMENT STACK RUNNING                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 System Status:${NC}"
echo -e "   ${GREEN}✅${NC} Supabase:  http://127.0.0.1:54321"
echo -e "   ${GREEN}✅${NC} Database:  localhost:54322"
echo -e "   ${GREEN}✅${NC} Frontend:  http://localhost:5174"
echo -e "   ${GREEN}✅${NC} Tables:    $TABLE_COUNT tables loaded"
echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo -e "   Email:    superadmin@yachtexcel.com"
echo -e "   Password: superadmin123"
echo ""
echo -e "${YELLOW}📝 To stop all services, run:${NC} ./stop_full_stack.sh"
echo ""
echo -e "${GREEN}🎉 Ready to develop!${NC}"
echo ""

# Keep script running so processes don't terminate
wait $VITE_PID
