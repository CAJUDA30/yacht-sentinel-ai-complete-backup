#!/bin/bash

# Supabase Local Database Backup Script
# This script creates timestamped backups of your local Supabase database

set -e  # Exit on error

# Configuration
BACKUP_DIR="./supabase_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="yacht_sentinel_${TIMESTAMP}"
RETENTION_DAYS=30  # Keep backups for 30 days

# Supabase local DB connection (from docker-compose)
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
echo -e "${BLUE}║    Yacht Sentinel AI - Supabase Backup System         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory: ${BACKUP_DIR}${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Full database backup
echo -e "${BLUE}🔄 Starting full database backup...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -F c \
    -f "${BACKUP_DIR}/${BACKUP_NAME}.dump"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database backup created: ${BACKUP_NAME}.dump${NC}"
else
    echo -e "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

# Also create a SQL text backup for easy viewing
echo -e "${BLUE}🔄 Creating SQL text backup...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    -f "${BACKUP_DIR}/${BACKUP_NAME}.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SQL backup created: ${BACKUP_NAME}.sql${NC}"
else
    echo -e "${RED}❌ SQL backup failed!${NC}"
fi

# Backup auth.users table specifically (critical data)
echo -e "${BLUE}🔄 Backing up auth.users table...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -t auth.users \
    -t public.user_roles \
    --clean \
    --if-exists \
    -f "${BACKUP_DIR}/${BACKUP_NAME}_auth.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Auth tables backup created: ${BACKUP_NAME}_auth.sql${NC}"
fi

# Compress backups to save space
echo -e "${BLUE}🗜️  Compressing backups...${NC}"
gzip -f "${BACKUP_DIR}/${BACKUP_NAME}.sql"
gzip -f "${BACKUP_DIR}/${BACKUP_NAME}_auth.sql"
echo -e "${GREEN}✅ Backups compressed${NC}"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
echo -e "${GREEN}📊 Backup size: ${BACKUP_SIZE}${NC}"

# Clean up old backups (keep last X days)
echo -e "${BLUE}🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "yacht_sentinel_*.dump" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "yacht_sentinel_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "yacht_sentinel_*_auth.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
echo ""
echo -e "${GREEN}📋 Recent backups:${NC}"
ls -lht "$BACKUP_DIR" | head -10

# Create backup manifest
echo -e "${BLUE}📝 Creating backup manifest...${NC}"
cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Yacht Sentinel AI Database Backup
==================================
Backup Name: ${BACKUP_NAME}
Created: $(date)
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}
Size: ${BACKUP_SIZE}

Files:
- ${BACKUP_NAME}.dump (PostgreSQL custom format - for restore)
- ${BACKUP_NAME}.sql.gz (SQL text format - compressed)
- ${BACKUP_NAME}_auth.sql.gz (Auth tables only - compressed)

To restore:
-----------
1. Full restore:
   pg_restore -h 127.0.0.1 -p 54322 -U postgres -d postgres -c ${BACKUP_DIR}/${BACKUP_NAME}.dump

2. Auth only restore:
   gunzip -c ${BACKUP_DIR}/${BACKUP_NAME}_auth.sql.gz | psql -h 127.0.0.1 -p 54322 -U postgres -d postgres

3. SQL restore:
   gunzip -c ${BACKUP_DIR}/${BACKUP_NAME}.sql.gz | psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Backup completed successfully!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Backup location: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}📝 Manifest: ${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt${NC}"
echo ""
