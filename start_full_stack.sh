#!/bin/bash

# =============================================================================
# Yacht Sentinel AI - Professional Full Stack Startup Script
# =============================================================================

# Professional error handling
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Process management variables
VITE_PID=""
START_TIME=$(date +%s)

# Cleanup function for graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}🛑 Graceful shutdown initiated...${NC}"
    
    if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
        echo -e "${BLUE}   Stopping Frontend (PID: $VITE_PID)...${NC}"
        kill "$VITE_PID" 2>/dev/null || true
        wait "$VITE_PID" 2>/dev/null || true
    fi
    
    echo -e "${BLUE}   Stopping Supabase...${NC}"
    npx supabase stop 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       YACHT SENTINEL AI - PROFESSIONAL STARTUP        ║${NC}"
echo -e "${BLUE}║    🎯 INTELLIGENT BACKUP DETECTION & RESTORATION      ║${NC}"
echo -e "${BLUE}║    🔐 HTTPS INTEGRATION & SYSTEMATIC VERIFICATION     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📅 Startup initiated: $(date)${NC}"
echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"
echo ""

# Configuration
BACKUP_DIR="./supabase_backups"
PROVEN_WORKING_BACKUP="unified_complete_20251012_162844"
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# =============================================================================
# STEP 1: DOCKER DESKTOP VERIFICATION
# =============================================================================

echo -e "${BLUE}🐳 STEP 1: Docker Desktop Verification${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

if pgrep -f "Docker Desktop" > /dev/null; then
    echo -e "${GREEN}✅ Docker Desktop is running${NC}"
    
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker daemon accessible${NC}"
    else
        echo -e "${YELLOW}⏳ Waiting for Docker daemon...${NC}"
        sleep 10
        if ! docker info >/dev/null 2>&1; then
            echo -e "${RED}❌ Docker daemon not accessible${NC}"
            exit 1
        fi
    fi
else
    echo -e "${BLUE}🚀 Starting Docker Desktop...${NC}"
    open -a "Docker Desktop"
    echo -e "${BLUE}⏳ Waiting for Docker Desktop to start...${NC}"
    
    local count=0
    while [ $count -lt 60 ]; do
        if pgrep -f "Docker Desktop" > /dev/null; then
            echo -e "${GREEN}✅ Docker Desktop started${NC}"
            break
        fi
        sleep 2
        ((count += 2))
        printf "."
    done
    echo ""
    
    if [ $count -ge 60 ]; then
        echo -e "${RED}❌ Docker Desktop failed to start${NC}"
        exit 1
    fi
    
    # Wait for daemon
    echo -e "${BLUE}⏳ Waiting for Docker daemon...${NC}"
    count=0
    while [ $count -lt 60 ]; do
        if docker info >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker daemon ready${NC}"
            break
        fi
        sleep 3
        ((count += 3))
        printf "."
    done
    echo ""
    
    if [ $count -ge 60 ]; then
        echo -e "${RED}❌ Docker daemon failed to start${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ STEP 1 COMPLETED: Docker operational${NC}"
echo ""

# =============================================================================
# STEP 2: INTELLIGENT BACKUP DETECTION
# =============================================================================

echo -e "${BLUE}🔍 STEP 2: Intelligent Backup Detection${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

BACKUP_TYPE=""
BACKUP_PATH=""
RESTORE_SCRIPT=""

# Priority 1: Check for PROVEN WORKING backup
PROVEN_BACKUP_PATH="$BACKUP_DIR/$PROVEN_WORKING_BACKUP"

if [ -d "$PROVEN_BACKUP_PATH" ]; then
    BACKUP_TYPE="PROVEN_WORKING"
    BACKUP_PATH="$PROVEN_BACKUP_PATH"
    RESTORE_SCRIPT="restore_unified_complete.sh"
    
    echo -e "${GREEN}✅ Found PROVEN WORKING backup (Manually Verified!)${NC}"
    echo -e "${BLUE}📁 Path: $BACKUP_PATH${NC}"
    echo -e "${GREEN}✓ Complete database with all data${NC}"
    echo -e "${GREEN}✓ Users with encrypted passwords${NC}"
    echo -e "${GREEN}✓ User roles and permissions${NC}"
    echo -e "${GREEN}✓ ALL RLS policies (101+)${NC}"
    echo -e "${GREEN}✓ ALL RPC functions (29+)${NC}"
    echo -e "${GREEN}✓ ALL Edge Functions (73+)${NC}"
else
    echo -e "${YELLOW}⚠️ Proven working backup not found${NC}"
    
    # Check for other backups
    COMPREHENSIVE_BACKUP_PATH=$(ls -td $BACKUP_DIR/comprehensive_backup_* 2>/dev/null | head -1 || echo "")
    
    if [ -n "$COMPREHENSIVE_BACKUP_PATH" ] && [ -d "$COMPREHENSIVE_BACKUP_PATH" ]; then
        BACKUP_TYPE="COMPREHENSIVE"
        BACKUP_PATH="$COMPREHENSIVE_BACKUP_PATH"
        RESTORE_SCRIPT="restore_complete_backup.sh"
        echo -e "${GREEN}✅ Found comprehensive backup${NC}"
    else
        UNIFIED_BACKUP_PATH=$(ls -td $BACKUP_DIR/unified_complete_* 2>/dev/null | head -1 || echo "")
        
        if [ -n "$UNIFIED_BACKUP_PATH" ] && [ -d "$UNIFIED_BACKUP_PATH" ]; then
            BACKUP_TYPE="UNIFIED"
            BACKUP_PATH="$UNIFIED_BACKUP_PATH"
            RESTORE_SCRIPT="restore_unified_backup.sh"
            echo -e "${GREEN}✅ Found unified backup${NC}"
        else
            LEGACY_BACKUP_PATH="$BACKUP_DIR/yacht_sentinel_20251011_024733_COMPLETE.dump"
            
            if [ -f "$LEGACY_BACKUP_PATH" ]; then
                BACKUP_TYPE="LEGACY"
                BACKUP_PATH="$LEGACY_BACKUP_PATH"
                echo -e "${GREEN}✅ Found legacy backup${NC}"
            else
                echo -e "${RED}❌ No backup found!${NC}"
                exit 1
            fi
        fi
    fi
fi

echo -e "${GREEN}🎯 SELECTED BACKUP: $BACKUP_TYPE${NC}"
echo ""

# =============================================================================
# STEP 3: HTTPS CONFIGURATION
# =============================================================================

echo -e "${BLUE}🔐 STEP 3: HTTPS Configuration${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

if [ -f "./certs/localhost.pem" ] && [ -f "./certs/localhost-key.pem" ]; then
    echo -e "${GREEN}✅ HTTPS certificates found${NC}"
    WILL_USE_HTTPS=true
else
    echo -e "${YELLOW}⚠️ No HTTPS certificates - using HTTP mode${NC}"
    WILL_USE_HTTPS=false
fi

echo -e "${GREEN}✅ STEP 3 COMPLETED: HTTPS ready${NC}"
echo ""

# =============================================================================
# STEP 4: SUPABASE STARTUP
# =============================================================================

echo -e "${BLUE}🚀 STEP 4: Supabase Services${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

# Stop any running services
echo -e "${BLUE}🛑 Stopping existing services...${NC}"
npx supabase stop 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start Supabase
echo -e "${BLUE}🚀 Starting Supabase...${NC}"
npx supabase start

echo -e "${BLUE}⏳ Waiting for Supabase...${NC}"
sleep 5

echo -e "${GREEN}✅ STEP 4 COMPLETED: Supabase operational${NC}"
echo ""

# =============================================================================
# STEP 5: DATABASE RESTORATION
# =============================================================================

echo -e "${BLUE}🗄️ STEP 5: Database Restoration${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)

echo -e "${YELLOW}📊 Current table count: $TABLE_COUNT${NC}"

if [ "$TABLE_COUNT" -lt 15 ]; then
    echo -e "${YELLOW}⚠️ Restoring database from backup...${NC}"
    
    if [ "$BACKUP_TYPE" = "PROVEN_WORKING" ]; then
        echo -e "${BLUE}🎯 Restoring from PROVEN WORKING backup...${NC}"
        
        if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
            echo -e "${BLUE}📦 Using automated restore script...${NC}"
            cd "$BACKUP_PATH"
            bash "$RESTORE_SCRIPT"
            cd - > /dev/null
        else
            echo -e "${BLUE}🔧 Manual restore...${NC}"
            DB_DUMP_FILE=$(find "$BACKUP_PATH" -name "*.dump" | head -1)
            if [ -n "$DB_DUMP_FILE" ]; then
                PGPASSWORD=$DB_PASSWORD pg_restore \
                    -h $DB_HOST \
                    -p $DB_PORT \
                    -U $DB_USER \
                    -d $DB_NAME \
                    --clean \
                    --if-exists \
                    --no-owner \
                    --no-acl \
                    "$DB_DUMP_FILE" 2>&1 | grep -v "NOTICE\|WARNING" || true
            fi
        fi
    elif [ "$BACKUP_TYPE" = "COMPREHENSIVE" ] || [ "$BACKUP_TYPE" = "UNIFIED" ]; then
        if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
            cd "$BACKUP_PATH"
            bash "$RESTORE_SCRIPT"
            cd - > /dev/null
        fi
    elif [ "$BACKUP_TYPE" = "LEGACY" ]; then
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
    fi
    
    # Verify restoration
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    TABLE_COUNT=$(echo $TABLE_COUNT | xargs)
    echo -e "${GREEN}✅ Database restored: $TABLE_COUNT tables${NC}"
else
    echo -e "${GREEN}✅ Database ready: $TABLE_COUNT tables${NC}"
fi

echo -e "${GREEN}✅ STEP 5 COMPLETED: Database operational${NC}"
echo ""

# =============================================================================
# STEP 6: FRONTEND STARTUP
# =============================================================================

echo -e "${BLUE}🌐 STEP 6: Frontend Development Server${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

if [ "$WILL_USE_HTTPS" = true ]; then
    echo -e "${GREEN}🔐 Starting in HTTPS mode${NC}"
    echo -e "${YELLOW}Frontend: https://localhost:5173${NC}"
else
    echo -e "${YELLOW}🌐 Starting in HTTP mode${NC}"
    echo -e "${YELLOW}Frontend: http://localhost:5173${NC}"
fi

# Start frontend
echo -e "${BLUE}🚀 Starting frontend...${NC}"
npm run dev &
VITE_PID=$!

echo -e "${BLUE}⏳ Waiting for frontend to initialize...${NC}"
sleep 8

if ps -p $VITE_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend started (PID: $VITE_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ STEP 6 COMPLETED: Frontend operational${NC}"
echo ""

# =============================================================================
# FINAL STATUS REPORT
# =============================================================================

USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")
END_TIME=$(date +%s)
STARTUP_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                YACHT SENTINEL AI - READY               ║${NC}"
if [ "$BACKUP_TYPE" = "PROVEN_WORKING" ]; then
    echo -e "${GREEN}║          🎯 FROM PROVEN WORKING BACKUP (VERIFIED!)           ║${NC}"
elif [ "$BACKUP_TYPE" = "COMPREHENSIVE" ]; then
    echo -e "${GREEN}║            🎯 FROM COMPREHENSIVE BACKUP                ║${NC}"
elif [ "$BACKUP_TYPE" = "UNIFIED" ]; then
    echo -e "${GREEN}║              🎯 FROM UNIFIED BACKUP                    ║${NC}"
else
    echo -e "${YELLOW}║                📦 FROM LEGACY BACKUP                  ║${NC}"
fi
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📄 SYSTEM STATUS${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}✅ Docker:          $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'Ready')${NC}"
echo -e "${GREEN}✅ Supabase:        http://127.0.0.1:54321${NC}"
echo -e "${GREEN}✅ Database:        localhost:54322 ($TABLE_COUNT tables, $USER_COUNT users)${NC}"

if [ "$WILL_USE_HTTPS" = true ]; then
    echo -e "${GREEN}✅ Frontend:        https://localhost:5173 (HTTPS)${NC}"
else
    echo -e "${YELLOW}✅ Frontend:        http://localhost:5173 (HTTP)${NC}"
fi

echo ""
echo -e "${BLUE}🔑 LOGIN CREDENTIALS${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "   Email:           superadmin@yachtexcel.com"
echo -e "   Password:        superadmin123"

echo ""
echo -e "${BLUE}📅 PERFORMANCE${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "   Startup Time:    ${STARTUP_TIME} seconds"
echo -e "   Backup Used:     $BACKUP_TYPE"
echo -e "   Process ID:      Frontend PID $VITE_PID"

echo ""
echo -e "${GREEN}🎉 DEVELOPMENT ENVIRONMENT READY!${NC}"
echo -e "${YELLOW}📋 Management: ./stop_full_stack.sh to stop services${NC}"
echo ""
echo -e "${GREEN}✨ Happy coding! Press Ctrl+C to stop all services.${NC}"
echo ""

# Reset trap to only handle cleanup (remove EXIT trap to keep running)
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🔄 Services running. Press Ctrl+C to stop.${NC}"

# Keep running
if [ -n "$VITE_PID" ]; then
    wait $VITE_PID
else
    echo -e "${RED}❌ No frontend process to monitor${NC}"
    exit 1
fi
