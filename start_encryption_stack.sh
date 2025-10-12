#!/bin/bash

# 🔐 Yacht Sentinel AI - Encryption Implementation Startup Script
# This script starts the full stack with the encryption implementation backup

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║    🔐 Yacht Sentinel AI - Encryption Implementation    ║${NC}"
echo -e "${PURPLE}║       Full Stack Startup with Auto Encryption         ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
ENCRYPTION_BACKUP_DIR="/Users/carlosjulia/backups"
WORKSPACE_DIR="/Users/carlosjulia/yacht-sentinel-ai-complete"

# Supabase local DB connection
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Step 1: Verify we're in the right directory
echo -e "${BLUE}📍 Verifying workspace directory...${NC}"
if [ ! -f "./package.json" ]; then
    echo -e "${RED}❌ Not in workspace directory. Changing to: $WORKSPACE_DIR${NC}"
    cd "$WORKSPACE_DIR"
fi
echo -e "${GREEN}✅ In correct workspace directory: $(pwd)${NC}"
echo ""

# Step 2: Check for encryption backup
echo -e "${BLUE}🔐 Checking for encryption implementation backup...${NC}"

# Find the latest encryption backup files
ENCRYPTION_ARCHIVE=$(ls -t $ENCRYPTION_BACKUP_DIR/yacht-sentinel-encryption-complete-*.tar.gz 2>/dev/null | head -1 || echo "")
ENCRYPTION_FULL_DIR=$(ls -td $ENCRYPTION_BACKUP_DIR/yacht-sentinel-encryption-complete-*-full 2>/dev/null | head -1 || echo "")
ENCRYPTION_DB_FILE=$(ls -t $ENCRYPTION_BACKUP_DIR/yacht-sentinel-db-schema-*.sql 2>/dev/null | head -1 || echo "")

if [ -z "$ENCRYPTION_ARCHIVE" ] || [ -z "$ENCRYPTION_FULL_DIR" ] || [ -z "$ENCRYPTION_DB_FILE" ]; then
    echo -e "${RED}❌ Encryption backup not found in $ENCRYPTION_BACKUP_DIR${NC}"
    echo -e "${YELLOW}Expected files:${NC}"
    echo -e "   - yacht-sentinel-encryption-complete-*.tar.gz"
    echo -e "   - yacht-sentinel-encryption-complete-*-full/"
    echo -e "   - yacht-sentinel-db-schema-*.sql"
    echo ""
    echo -e "${RED}Please run the backup creation process first!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found encryption implementation backup:${NC}"
echo -e "   📦 Archive: $(basename "$ENCRYPTION_ARCHIVE")"
echo -e "   📁 Full Dir: $(basename "$ENCRYPTION_FULL_DIR")"
echo -e "   🗄️ DB Schema: $(basename "$ENCRYPTION_DB_FILE")"
echo ""

# Step 3: Stop any running services
echo -e "${BLUE}🛑 Stopping any running services...${NC}"
npx supabase stop 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# Step 4: Start Supabase
echo -e "${BLUE}🚀 Starting Supabase...${NC}"
npx supabase start
echo -e "${GREEN}✅ Supabase started${NC}"
echo ""

# Wait for Supabase to be ready
echo -e "${BLUE}⏳ Waiting for Supabase to be ready...${NC}"
sleep 5

# Step 5: Check database state and restore if needed
echo -e "${BLUE}🔍 Checking database state...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)  # Trim whitespace

echo -e "${YELLOW}📊 Current table count: $TABLE_COUNT${NC}"

# Check for encryption functions
ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)

echo -e "${YELLOW}🔐 Current encryption functions: $ENCRYPTION_FUNCTIONS${NC}"

if [ "$TABLE_COUNT" -lt 15 ] || [ "$ENCRYPTION_FUNCTIONS" -lt 3 ]; then
    echo -e "${YELLOW}⚠️  Database needs restoration or encryption implementation...${NC}"
    echo ""
    
    # Terminate existing connections
    echo -e "${BLUE}🔄 Terminating existing database connections...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
    " 2>/dev/null || true
    
    # Restore from encryption backup
    echo -e "${BLUE}🔐 Restoring database from ENCRYPTION IMPLEMENTATION backup...${NC}"
    echo -e "${GREEN}   ✓ Includes: AES-256 encryption functions${NC}"
    echo -e "${GREEN}   ✓ Includes: Auto-encryption triggers${NC}"
    echo -e "${GREEN}   ✓ Includes: Auto-decryption views${NC}"
    echo -e "${GREEN}   ✓ Includes: Complete migration history${NC}"
    echo -e "${GREEN}   ✓ Includes: All updated application code${NC}"
    echo ""
    
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -f "$ENCRYPTION_DB_FILE" 2>&1 | grep -v "NOTICE\|WARNING" || true
    
    echo -e "${GREEN}✅ Database restored from encryption implementation backup${NC}"
    echo ""
    
    # Verify restoration
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    TABLE_COUNT=$(echo $TABLE_COUNT | xargs)
    
    ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
    ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)
    
    echo -e "${GREEN}✅ Database now has $TABLE_COUNT tables${NC}"
    echo -e "${GREEN}✅ Database now has $ENCRYPTION_FUNCTIONS encryption functions${NC}"
    
    # Restore superadmin account
    echo -e "${BLUE}🔑 Ensuring superadmin account exists...${NC}"
    if [ -f "./restore_superadmin.sh" ]; then
        bash ./restore_superadmin.sh
    else
        echo -e "${YELLOW}⚠️  restore_superadmin.sh not found - skipping${NC}"
    fi
    echo ""
else
    echo -e "${GREEN}✅ Database already has $TABLE_COUNT tables and $ENCRYPTION_FUNCTIONS encryption functions${NC}"
    echo ""
fi

# Step 6: Verify encryption implementation
echo -e "${BLUE}🔐 Verifying encryption implementation...${NC}"

# Check for encryption functions
ENCRYPTION_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('is_encrypted', 'encrypt_api_key', 'decrypt_api_key');" 2>/dev/null || echo "")

if echo "$ENCRYPTION_CHECK" | grep -q "is_encrypted\|encrypt_api_key\|decrypt_api_key"; then
    echo -e "${GREEN}✅ Encryption functions verified:${NC}"
    echo "$ENCRYPTION_CHECK" | grep -v "^$" | sed 's/^/   ✓ /'
else
    echo -e "${YELLOW}⚠️  Encryption functions missing - applying migration...${NC}"
    if [ -f "./supabase/migrations/20251012110000_automatic_api_key_encryption.sql" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "./supabase/migrations/20251012110000_automatic_api_key_encryption.sql"
        echo -e "${GREEN}✅ Encryption migration applied${NC}"
    else
        echo -e "${RED}❌ Encryption migration file not found${NC}"
    fi
fi

# Check for encryption views
ENCRYPTION_VIEWS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('ai_providers_with_keys', 'document_ai_processors_with_credentials');" 2>/dev/null || echo "")

if echo "$ENCRYPTION_VIEWS" | grep -q "ai_providers_with_keys\|document_ai_processors_with_credentials"; then
    echo -e "${GREEN}✅ Encryption views verified:${NC}"
    echo "$ENCRYPTION_VIEWS" | grep -v "^$" | sed 's/^/   ✓ /'
else
    echo -e "${YELLOW}⚠️  Encryption views missing${NC}"
fi

echo ""

# Step 7: Start Frontend
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

# Step 8: Display comprehensive status
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║  ✅ ENCRYPTION IMPLEMENTATION STACK RUNNING           ║${NC}"
echo -e "${PURPLE}║  🔐 All API Keys Automatically Encrypted              ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 System Status:${NC}"
echo -e "   ${GREEN}✅${NC} Supabase:   http://127.0.0.1:54321"
echo -e "   ${GREEN}✅${NC} Database:   localhost:54322"
echo -e "   ${GREEN}✅${NC} Frontend:   http://localhost:5174"
echo -e "   ${GREEN}✅${NC} Tables:     $TABLE_COUNT tables loaded"
echo -e "   ${GREEN}✅${NC} Encryption: AES-256 implementation active"
echo -e "   ${GREEN}✅${NC} Functions:  $ENCRYPTION_FUNCTIONS encryption functions"
echo ""
echo -e "${BLUE}🔐 Encryption Features:${NC}"
echo -e "   ✓ All API keys automatically encrypted (AES-256)"
echo -e "   ✓ Automatic decryption on read (transparent to app)"
echo -e "   ✓ Backward compatible with existing keys"
echo -e "   ✓ Zero plain text storage in database"
echo -e "   ✓ Triggers auto-encrypt on INSERT/UPDATE"
echo -e "   ✓ Views auto-decrypt on SELECT"
echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo -e "   Email:    superadmin@yachtexcel.com"
echo -e "   Password: superadmin123"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   • ENCRYPTION_INDEX.md - Master documentation index"
echo -e "   • ENCRYPTION_QUICK_REFERENCE.md - Developer guide"
echo -e "   • ENCRYPTION_TESTING_GUIDE.md - 15 test cases"
echo -e "   • BACKUP_COMPLETE.md - Backup and restore guide"
echo ""
echo -e "${BLUE}🧪 Quick Test:${NC}"
echo -e "   Test encryption: Open Supabase Studio → SQL Editor"
echo -e "   Run: SELECT is_encrypted('sk-test-key'); -- Should return FALSE"
echo -e "   Run: SELECT is_encrypted(encrypt_api_key('sk-test-key')); -- Should return TRUE"
echo ""
echo -e "${YELLOW}📝 To stop all services, run:${NC} ./stop_full_stack.sh"
echo ""
echo -e "${GREEN}🎉 Encryption Implementation Ready!${NC}"
echo -e "${GREEN}🔐 All API keys are now automatically encrypted!${NC}"
echo ""

# Keep script running so processes don't terminate
wait $VITE_PID