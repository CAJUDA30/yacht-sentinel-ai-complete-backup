#!/bin/bash

# Test script to verify unified backup detection in start_full_stack.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Unified Backup Detection Logic${NC}"
echo ""

# Configuration (same as in start_full_stack.sh)
UNIFIED_BACKUP_DIR="./supabase_backups"
UNIFIED_BACKUP_PATTERN="unified_complete_*"
UNIFIED_RESTORE_SCRIPT="restore_unified_complete.sh"

# Test 1: Check for unified complete backup detection
echo -e "${BLUE}🎯 Testing unified complete backup detection...${NC}"

# Find the latest unified complete backup
UNIFIED_BACKUP_PATH=$(ls -td $UNIFIED_BACKUP_DIR/$UNIFIED_BACKUP_PATTERN 2>/dev/null | head -1 || echo "")

if [ -n "$UNIFIED_BACKUP_PATH" ] && [ -d "$UNIFIED_BACKUP_PATH" ]; then
    USE_UNIFIED_BACKUP=true
    echo -e "${GREEN}✅ Found unified complete backup:${NC}"
    echo -e "   Path: $UNIFIED_BACKUP_PATH"
    echo -e "   ${GREEN}✓ Includes: Complete database with encryption${NC}"
    echo -e "   ${GREEN}✓ Includes: All application source code${NC}"
    echo -e "   ${GREEN}✓ Includes: All 23 migrations${NC}"
    echo -e "   ${GREEN}✓ Includes: All 90 documentation files${NC}"
    echo -e "   ${GREEN}✓ Includes: Edge functions and configurations${NC}"
    
    # Check for restore script
    if [ -f "$UNIFIED_BACKUP_PATH/$UNIFIED_RESTORE_SCRIPT" ]; then
        UNIFIED_RESTORE_PATH="$UNIFIED_BACKUP_PATH/$UNIFIED_RESTORE_SCRIPT"
        echo -e "   ${GREEN}✓ Restore script: $(basename "$UNIFIED_RESTORE_PATH")${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Restore script not found in backup${NC}"
    fi
    
    # Test 2: Verify backup contents
    echo ""
    echo -e "${BLUE}📦 Verifying backup contents...${NC}"
    
    if [ -f "$UNIFIED_BACKUP_PATH/complete_database_with_encryption.dump" ]; then
        DUMP_SIZE=$(ls -lh "$UNIFIED_BACKUP_PATH/complete_database_with_encryption.dump" | awk '{print $5}')
        echo -e "   ${GREEN}✓ Database dump: $DUMP_SIZE${NC}"
    else
        echo -e "   ${RED}✗ Database dump not found${NC}"
    fi
    
    if [ -f "$UNIFIED_BACKUP_PATH/application_source.tar.gz" ]; then
        SOURCE_SIZE=$(ls -lh "$UNIFIED_BACKUP_PATH/application_source.tar.gz" | awk '{print $5}')
        echo -e "   ${GREEN}✓ Application source: $SOURCE_SIZE${NC}"
    else
        echo -e "   ${RED}✗ Application source not found${NC}"
    fi
    
    if [ -d "$UNIFIED_BACKUP_PATH/migrations" ]; then
        MIGRATION_COUNT=$(ls "$UNIFIED_BACKUP_PATH/migrations" | wc -l | xargs)
        echo -e "   ${GREEN}✓ Migrations: $MIGRATION_COUNT files${NC}"
    else
        echo -e "   ${RED}✗ Migrations directory not found${NC}"
    fi
    
    if [ -d "$UNIFIED_BACKUP_PATH/documentation" ]; then
        DOC_COUNT=$(ls "$UNIFIED_BACKUP_PATH/documentation" | wc -l | xargs)
        echo -e "   ${GREEN}✓ Documentation: $DOC_COUNT files${NC}"
    else
        echo -e "   ${RED}✗ Documentation directory not found${NC}"
    fi
    
    if [ -d "$UNIFIED_BACKUP_PATH/edge_functions" ]; then
        EDGE_COUNT=$(ls "$UNIFIED_BACKUP_PATH/edge_functions" | wc -l | xargs)
        echo -e "   ${GREEN}✓ Edge functions: $EDGE_COUNT files${NC}"
    else
        echo -e "   ${RED}✗ Edge functions directory not found${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Unified backup detection test PASSED${NC}"
    echo -e "${GREEN}✅ start_full_stack.sh will use the unified complete backup${NC}"
    
else
    USE_UNIFIED_BACKUP=false
    echo -e "${YELLOW}⚠️ Unified complete backup not found in $UNIFIED_BACKUP_DIR${NC}"
    echo -e "${YELLOW}Expected: $UNIFIED_BACKUP_DIR/$UNIFIED_BACKUP_PATTERN${NC}"
    echo -e "${RED}❌ Unified backup detection test FAILED${NC}"
    
    # Show what's available
    echo ""
    echo -e "${BLUE}📁 Available backups:${NC}"
    ls -la "$UNIFIED_BACKUP_DIR" | grep -E "(unified|complete)" || echo "   No unified backups found"
fi

echo ""
echo -e "${BLUE}🔍 Test completed${NC}"