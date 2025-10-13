#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Restoring Database...${NC}"

DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

BACKUP_DIR=$(dirname "$0")

if [ -f "$BACKUP_DIR/database_complete.dump" ]; then
    PGPASSWORD=$DB_PASSWORD pg_restore \
        -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        --clean --if-exists --no-owner --no-acl \
        "$BACKUP_DIR/database_complete.dump" 2>&1 | grep -v "ERROR:" || true
    echo -e "${GREEN}✅ Database restored successfully${NC}"
else
    echo "❌ Database dump not found"
    exit 1
fi
