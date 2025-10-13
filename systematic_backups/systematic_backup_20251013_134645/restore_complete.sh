#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 Complete System Restore${NC}"
echo "=========================="
echo ""

BACKUP_DIR=$(dirname "$0")

# Restore database
echo -e "${BLUE}Step 1: Restoring database...${NC}"
bash "$BACKUP_DIR/restore_database.sh"
echo ""

# Extract source code
echo -e "${BLUE}Step 2: Source code available in source_code.tar.gz${NC}"
echo -e "${YELLOW}   To restore: tar -xzf source_code.tar.gz -C /path/to/restore${NC}"
echo ""

echo -e "${GREEN}✅ Database restoration complete${NC}"
echo -e "${YELLOW}⚠️  Source code and configurations available in backup directory${NC}"
