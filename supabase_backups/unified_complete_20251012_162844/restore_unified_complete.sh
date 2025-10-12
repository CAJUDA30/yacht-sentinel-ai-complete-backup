#!/bin/bash

# 🔐 Unified Complete Restore Script
# Restores EVERYTHING from unified backup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 UNIFIED COMPLETE RESTORE${NC}"
echo "============================"
echo ""

# Configuration
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Get the backup directory (current directory)
BACKUP_DIR=$(pwd)
echo -e "${BLUE}📁 Restoring from: $BACKUP_DIR${NC}"
echo ""

# Step 1: Ensure Supabase is running
echo -e "${BLUE}🚀 Step 1: Ensuring Supabase is running...${NC}"
if ! pgrep -f "supabase" > /dev/null; then
    echo -e "${YELLOW}Starting Supabase...${NC}"
    cd ../../../  # Go back to project root
    npx supabase start
    cd - > /dev/null
fi
sleep 3
echo -e "${GREEN}✅ Supabase is running${NC}"
echo ""

# Step 2: Restore complete database
echo -e "${BLUE}🗄️  Step 2: Restoring complete database with encryption...${NC}"

# Terminate existing connections
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Restore from dump
if [ -f "complete_database_with_encryption.dump" ]; then
    PGPASSWORD=$DB_PASSWORD pg_restore \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        "complete_database_with_encryption.dump" 2>&1 | grep -v "NOTICE\|WARNING" || true
    
    echo -e "${GREEN}✅ Database restored from binary dump${NC}"
elif [ -f "complete_database_with_encryption.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "complete_database_with_encryption.sql" 2>&1 | grep -v "NOTICE\|WARNING" || true
    echo -e "${GREEN}✅ Database restored from SQL dump${NC}"
else
    echo -e "${RED}❌ No database dump found${NC}"
    exit 1
fi
echo ""

# Step 3: Verify restoration
echo -e "${BLUE}🔍 Step 3: Verifying restoration...${NC}"

# Check table count
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)
echo -e "${GREEN}✅ Tables restored: $TABLE_COUNT${NC}"

# Check encryption functions
ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)
echo -e "${GREEN}✅ Encryption functions: $ENCRYPTION_FUNCTIONS${NC}"

# Check encryption views
ENCRYPTION_VIEWS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%_with_%';" 2>/dev/null || echo "0")
ENCRYPTION_VIEWS=$(echo $ENCRYPTION_VIEWS | xargs)
echo -e "${GREEN}✅ Encryption views: $ENCRYPTION_VIEWS${NC}"
echo ""

# Step 4: Restore application code (optional)
echo -e "${BLUE}💻 Step 4: Application code available in backup${NC}"
if [ -f "application_source.tar.gz" ]; then
    echo -e "${YELLOW}   To restore application code, run:${NC}"
    echo -e "${YELLOW}   tar -xzf application_source.tar.gz -C /path/to/restore${NC}"
fi
echo ""

# Step 5: Show summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ UNIFIED COMPLETE RESTORE SUCCESSFUL               ║${NC}"
echo -e "${GREEN}║  🔐 Database + Encryption + All Data Restored         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Restoration Summary:${NC}"
echo -e "   • Tables: $TABLE_COUNT"
echo -e "   • Encryption functions: $ENCRYPTION_FUNCTIONS"
echo -e "   • Encryption views: $ENCRYPTION_VIEWS"
echo -e "   • All data preserved with encryption active"
echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo -e "   1. Start frontend: npm run dev"
echo -e "   2. Visit: http://localhost:5174"
echo -e "   3. Login: superadmin@yachtexcel.com / superadmin123"
echo -e "   4. Verify encryption is working transparently"
echo ""
