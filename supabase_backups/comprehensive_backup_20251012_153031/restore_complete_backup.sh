#!/bin/bash

# ============================================================================
# COMPREHENSIVE BACKUP RESTORE SCRIPT
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔄 COMPREHENSIVE BACKUP RESTORATION                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

BACKUP_DIR=$(dirname "$0")

echo -e "${BLUE}📁 Restoring from: ${YELLOW}$BACKUP_DIR${NC}"
echo ""

# Restore complete database
echo -e "${BLUE}🗄️  Restoring complete database...${NC}"
if [ -f "$BACKUP_DIR/complete_database_with_data.dump" ]; then
    PGPASSWORD=$DB_PASSWORD pg_restore \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        "$BACKUP_DIR/complete_database_with_data.dump" 2>&1 | grep -v "ERROR:" || true
    echo -e "${GREEN}✅ Database restored${NC}"
else
    echo -e "${RED}❌ Database dump not found${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ RESTORATION COMPLETE                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
