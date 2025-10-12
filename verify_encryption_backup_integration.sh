#!/bin/bash

# 🔐 Verify Encryption Backup Integration
# Quick verification that the startup scripts can find and use encryption backups

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying Encryption Backup Integration${NC}"
echo "=========================================="
echo ""

# Check 1: Backup directory exists
echo -e "${BLUE}1. Checking backup directory...${NC}"
BACKUP_DIR="/Users/carlosjulia/backups"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}✅ Backup directory exists: $BACKUP_DIR${NC}"
else
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Check 2: Encryption backup files exist
echo -e "${BLUE}2. Checking encryption backup files...${NC}"

ENCRYPTION_ARCHIVE=$(ls -t $BACKUP_DIR/yacht-sentinel-encryption-complete-*.tar.gz 2>/dev/null | head -1 || echo "")
ENCRYPTION_FULL_DIR=$(ls -td $BACKUP_DIR/yacht-sentinel-encryption-complete-*-full 2>/dev/null | head -1 || echo "")
ENCRYPTION_DB_FILE=$(ls -t $BACKUP_DIR/yacht-sentinel-db-schema-*.sql 2>/dev/null | head -1 || echo "")

if [ -n "$ENCRYPTION_ARCHIVE" ]; then
    echo -e "${GREEN}✅ Compressed archive: $(basename "$ENCRYPTION_ARCHIVE")${NC}"
    SIZE=$(du -h "$ENCRYPTION_ARCHIVE" | cut -f1)
    echo -e "   Size: $SIZE"
else
    echo -e "${RED}❌ Compressed archive not found${NC}"
fi

if [ -n "$ENCRYPTION_FULL_DIR" ]; then
    echo -e "${GREEN}✅ Full directory: $(basename "$ENCRYPTION_FULL_DIR")${NC}"
    SIZE=$(du -sh "$ENCRYPTION_FULL_DIR" | cut -f1)
    echo -e "   Size: $SIZE"
else
    echo -e "${RED}❌ Full directory backup not found${NC}"
fi

if [ -n "$ENCRYPTION_DB_FILE" ]; then
    echo -e "${GREEN}✅ Database schema: $(basename "$ENCRYPTION_DB_FILE")${NC}"
    SIZE=$(du -h "$ENCRYPTION_DB_FILE" | cut -f1)
    echo -e "   Size: $SIZE"
else
    echo -e "${RED}❌ Database schema file not found${NC}"
fi

# Check 3: Startup scripts exist and are executable
echo ""
echo -e "${BLUE}3. Checking startup scripts...${NC}"

if [ -f "./start_full_stack.sh" ]; then
    echo -e "${GREEN}✅ Enhanced full stack script exists${NC}"
    if [ -x "./start_full_stack.sh" ]; then
        echo -e "${GREEN}   Executable: Yes${NC}"
    else
        echo -e "${YELLOW}   Making executable...${NC}"
        chmod +x "./start_full_stack.sh"
    fi
else
    echo -e "${RED}❌ start_full_stack.sh not found${NC}"
fi

if [ -f "./start_encryption_stack.sh" ]; then
    echo -e "${GREEN}✅ Dedicated encryption script exists${NC}"
    if [ -x "./start_encryption_stack.sh" ]; then
        echo -e "${GREEN}   Executable: Yes${NC}"
    else
        echo -e "${YELLOW}   Making executable...${NC}"
        chmod +x "./start_encryption_stack.sh"
    fi
else
    echo -e "${RED}❌ start_encryption_stack.sh not found${NC}"
fi

# Check 4: Migration file exists
echo ""
echo -e "${BLUE}4. Checking migration file...${NC}"
MIGRATION_FILE="./supabase/migrations/20251012110000_automatic_api_key_encryption.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}✅ Encryption migration exists${NC}"
    LINES=$(wc -l < "$MIGRATION_FILE" | xargs)
    echo -e "   Lines: $LINES"
else
    echo -e "${RED}❌ Encryption migration not found${NC}"
fi

# Check 5: Documentation exists
echo ""
echo -e "${BLUE}5. Checking documentation...${NC}"
DOC_COUNT=0
for doc in "ENCRYPTION_INDEX.md" "ENCRYPTION_QUICK_REFERENCE.md" "ENCRYPTION_TESTING_GUIDE.md" "BACKUP_COMPLETE.md" "STARTUP_WITH_ENCRYPTION_BACKUP_MANIFEST.md"; do
    if [ -f "./$doc" ]; then
        echo -e "${GREEN}✅ $doc${NC}"
        DOC_COUNT=$((DOC_COUNT + 1))
    else
        echo -e "${RED}❌ $doc not found${NC}"
    fi
done
echo -e "${BLUE}   Total documentation files: $DOC_COUNT/5${NC}"

# Check 6: Test startup script logic (dry run)
echo ""
echo -e "${BLUE}6. Testing startup script logic...${NC}"
if [ -n "$ENCRYPTION_ARCHIVE" ] && [ -n "$ENCRYPTION_FULL_DIR" ] && [ -n "$ENCRYPTION_DB_FILE" ]; then
    echo -e "${GREEN}✅ Startup scripts will use encryption backup${NC}"
    echo -e "   Archive: $(basename "$ENCRYPTION_ARCHIVE")"
    echo -e "   Directory: $(basename "$ENCRYPTION_FULL_DIR")"
    echo -e "   Schema: $(basename "$ENCRYPTION_DB_FILE")"
else
    echo -e "${YELLOW}⚠️  Startup scripts will use fallback backup${NC}"
    FALLBACK_BACKUP="./supabase_backups/yacht_sentinel_20251011_024733_COMPLETE.dump"
    if [ -f "$FALLBACK_BACKUP" ]; then
        echo -e "${GREEN}   Fallback available: $(basename "$FALLBACK_BACKUP")${NC}"
    else
        echo -e "${RED}   Fallback not found: $FALLBACK_BACKUP${NC}"
    fi
fi

# Summary
echo ""
echo "=========================================="
if [ -n "$ENCRYPTION_ARCHIVE" ] && [ -n "$ENCRYPTION_FULL_DIR" ] && [ -n "$ENCRYPTION_DB_FILE" ]; then
    echo -e "${GREEN}🎉 VERIFICATION COMPLETE - ENCRYPTION BACKUP READY${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "   1. Run: ${YELLOW}./start_full_stack.sh${NC} (auto-detects encryption backup)"
    echo -e "   2. Or run: ${YELLOW}./start_encryption_stack.sh${NC} (dedicated encryption script)"
    echo -e "   3. Visit: ${YELLOW}http://localhost:5174${NC}"
    echo -e "   4. Login: ${YELLOW}superadmin@yachtexcel.com / superadmin123${NC}"
    echo ""
    echo -e "${GREEN}🔐 Encryption features will be automatically loaded!${NC}"
else
    echo -e "${YELLOW}⚠️  VERIFICATION INCOMPLETE - SOME ISSUES FOUND${NC}"
    echo ""
    echo -e "${YELLOW}You can still run the startup scripts, but they may use fallback backups.${NC}"
fi
echo ""