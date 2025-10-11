#!/bin/bash

# Supabase Database Restore Script
# This script restores a Supabase database from backup

set -e  # Exit on error

# Configuration
BACKUP_DIR="./supabase_backups"

# Supabase local DB connection
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Supabase Restore System        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: ${BACKUP_DIR}${NC}"
    echo -e "${YELLOW}💡 Run ./backup_supabase.sh first to create backups${NC}"
    exit 1
fi

# List available backups
echo -e "${BLUE}📋 Available backups:${NC}"
echo ""
BACKUPS=($(ls -t $BACKUP_DIR/*.dump 2>/dev/null || true))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo -e "${RED}❌ No backup files found in ${BACKUP_DIR}${NC}"
    echo -e "${YELLOW}💡 Run ./backup_supabase.sh first to create backups${NC}"
    exit 1
fi

# Display backups with numbers
counter=1
for backup in "${BACKUPS[@]}"; do
    backup_name=$(basename "$backup")
    backup_size=$(du -h "$backup" | cut -f1)
    backup_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d'.' -f1)
    echo -e "${YELLOW}[$counter]${NC} $backup_name"
    echo -e "    Size: ${backup_size} | Created: ${backup_date}"
    echo ""
    counter=$((counter + 1))
done

# Ask user to select backup
echo -e "${BLUE}Select backup to restore [1-${#BACKUPS[@]}]:${NC} "
read selection

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#BACKUPS[@]} ]; then
    echo -e "${RED}❌ Invalid selection${NC}"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$((selection - 1))]}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will restore the database to:${NC}"
echo -e "${YELLOW}   $(basename $SELECTED_BACKUP)${NC}"
echo ""
echo -e "${RED}⚠️  CRITICAL: This will OVERWRITE the current database!${NC}"
echo -e "${YELLOW}   Current data will be LOST unless you backup first!${NC}"
echo ""
echo -e "${BLUE}Do you want to create a backup of the current database first? [Y/n]:${NC} "
read create_backup

if [[ ! "$create_backup" =~ ^[Nn]$ ]]; then
    echo -e "${BLUE}🔄 Creating safety backup of current database...${NC}"
    ./backup_supabase.sh
    echo ""
fi

echo -e "${BLUE}Type 'RESTORE' to confirm restoration:${NC} "
read confirmation

if [ "$confirmation" != "RESTORE" ]; then
    echo -e "${YELLOW}❌ Restoration cancelled${NC}"
    exit 0
fi

# Perform restoration
echo ""
echo -e "${BLUE}🔄 Starting database restoration...${NC}"
echo ""

# Drop all existing connections
echo -e "${YELLOW}📌 Terminating existing database connections...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Restore from backup
echo -e "${BLUE}🔄 Restoring database from backup...${NC}"
PGPASSWORD=$DB_PASSWORD pg_restore \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --verbose \
    "$SELECTED_BACKUP"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
else
    echo ""
    echo -e "${RED}⚠️  Restore completed with warnings (this is normal for some system objects)${NC}"
fi

# Restore superadmin account
echo ""
echo -e "${BLUE}🔄 Restoring superadmin account...${NC}"
if [ -f "./restore_superadmin.sh" ]; then
    ./restore_superadmin.sh
else
    echo -e "${YELLOW}⚠️  restore_superadmin.sh not found - you may need to restore admin access manually${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Restoration completed!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Verify the restored data"
echo -e "   2. Login at http://localhost:5173/login"
echo -e "   3. Check superadmin access: superadmin@yachtexcel.com / admin123"
echo ""
