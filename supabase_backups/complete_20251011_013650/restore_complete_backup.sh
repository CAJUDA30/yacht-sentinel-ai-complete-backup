#!/bin/bash

# ============================================================================
# COMPLETE SUPABASE RESTORE SCRIPT
# ============================================================================

set -e

# Get backup directory (where this script is located)
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_PREFIX=$(basename "$BACKUP_DIR" | sed 's/complete_/yacht_sentinel_complete_/')

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m' 
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 COMPREHENSIVE SUPABASE RESTORE${NC}"
echo -e "${BLUE}==================================${NC}"
echo -e "Backup: ${BACKUP_PREFIX}"
echo ""

# Database connection
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${YELLOW}⚠️  This will completely replace your current database!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo -e "${BLUE}🗄️  Restoring complete database...${NC}"
pg_restore --clean --if-exists --create --verbose \
    --host=localhost --port=54322 --username=postgres \
    --dbname=postgres "${BACKUP_PREFIX}_complete.dump"

echo -e "${BLUE}🔒 Restoring RLS policies...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_rls_policies.sql"

echo -e "${BLUE}⚡ Restoring RPC functions...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_rpc_functions.sql"

echo -e "${BLUE}👥 Restoring auth users...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_auth_users.sql"

if [ -d "edge_functions" ]; then
    echo -e "${BLUE}🌐 Restoring Edge functions...${NC}"
    cp -r edge_functions/* ../../supabase/functions/
fi

if [ -d "migrations" ]; then
    echo -e "${BLUE}📝 Restoring migrations...${NC}"
    cp -r migrations/* ../../supabase/migrations/
fi

echo -e "${GREEN}✅ Complete restore finished!${NC}"
echo -e "${GREEN}🚀 Restart Supabase to apply all changes${NC}"
