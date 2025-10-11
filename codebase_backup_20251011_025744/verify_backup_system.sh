#!/bin/bash

# Backup System Verification Script
# This script verifies that all backup components are properly configured

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Backup System Verification     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Executable scripts
echo -e "${BLUE}1️⃣  Checking backup scripts...${NC}"
SCRIPTS=("backup_supabase.sh" "restore_supabase.sh" "setup_cron_backup.sh" "restore_superadmin.sh")

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}   ✅ $script - executable${NC}"
        else
            echo -e "${YELLOW}   ⚠️  $script - not executable (fixing...)${NC}"
            chmod +x "$script"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}   ❌ $script - missing!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check 2: Backup directory
echo -e "${BLUE}2️⃣  Checking backup directory...${NC}"
if [ -d "./supabase_backups" ]; then
    BACKUP_COUNT=$(ls -1 ./supabase_backups/*.dump 2>/dev/null | wc -l | xargs)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✅ Backup directory exists with $BACKUP_COUNT backup(s)${NC}"
        
        # Show latest backup
        LATEST_BACKUP=$(ls -t ./supabase_backups/*.dump 2>/dev/null | head -1)
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" 2>/dev/null | cut -f1)
        BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LATEST_BACKUP" 2>/dev/null || stat -c "%y" "$LATEST_BACKUP" 2>/dev/null | cut -d'.' -f1)
        echo -e "${GREEN}   📦 Latest: $(basename $LATEST_BACKUP)${NC}"
        echo -e "${GREEN}      Size: $BACKUP_SIZE | Date: $BACKUP_DATE${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Backup directory exists but is empty${NC}"
        echo -e "${YELLOW}      Run: ./backup_supabase.sh${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}   ⚠️  Backup directory doesn't exist (will be created on first backup)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 3: Cron jobs
echo -e "${BLUE}3️⃣  Checking automated backups (cron)...${NC}"
CRON_OUTPUT=$(crontab -l 2>/dev/null | grep backup || true)

if [ -n "$CRON_OUTPUT" ]; then
    echo -e "${GREEN}   ✅ Cron backup jobs found:${NC}"
    echo "$CRON_OUTPUT" | while read line; do
        echo -e "${GREEN}      $line${NC}"
    done
else
    echo -e "${YELLOW}   ⚠️  No automated backups configured${NC}"
    echo -e "${YELLOW}      Recommend: ./setup_cron_backup.sh${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: Supabase status
echo -e "${BLUE}4️⃣  Checking Supabase status...${NC}"
if npx supabase status &>/dev/null; then
    echo -e "${GREEN}   ✅ Supabase is running${NC}"
    
    # Try to connect to database
    if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1;" &>/dev/null; then
        echo -e "${GREEN}   ✅ Database connection successful${NC}"
    else
        echo -e "${RED}   ❌ Cannot connect to database${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}   ⚠️  Supabase is not running${NC}"
    echo -e "${YELLOW}      Start with: npx supabase start${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 5: Superadmin account
echo -e "${BLUE}5️⃣  Checking superadmin account...${NC}"
if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    );" -t -A 2>/dev/null | grep -q "t"; then
    
    # Check if has superadmin role
    if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
        SELECT EXISTS(
            SELECT 1 FROM public.user_roles ur
            JOIN auth.users u ON u.id = ur.user_id
            WHERE u.email = 'superadmin@yachtexcel.com'
            AND ur.role = 'superadmin'
        );" -t -A 2>/dev/null | grep -q "t"; then
        echo -e "${GREEN}   ✅ Superadmin account exists with correct roles${NC}"
        echo -e "${GREEN}      Email: superadmin@yachtexcel.com${NC}"
        echo -e "${GREEN}      Password: admin123${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Superadmin account exists but missing roles${NC}"
        echo -e "${YELLOW}      Fix with: ./restore_superadmin.sh${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}   ⚠️  Superadmin account not found${NC}"
    echo -e "${YELLOW}      Create with: ./restore_superadmin.sh${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: Documentation
echo -e "${BLUE}6️⃣  Checking documentation...${NC}"
DOCS=("BACKUP_SYSTEM.md" "SUPERADMIN_MANAGEMENT.md" "DATABASE_OPERATIONS_GUIDE.md")

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}   ✅ $doc${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $doc - missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Check 7: Disk space
echo -e "${BLUE}7️⃣  Checking disk space...${NC}"
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${GREEN}   ✅ Disk usage: ${DISK_USAGE}% (sufficient space)${NC}"
else
    echo -e "${RED}   ❌ Disk usage: ${DISK_USAGE}% (running out of space!)${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}║  ✅ All checks passed! Backup system ready.           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📋 System Status: READY${NC}"
    echo -e "${GREEN}   ✅ All scripts executable${NC}"
    echo -e "${GREEN}   ✅ Backups configured${NC}"
    echo -e "${GREEN}   ✅ Database accessible${NC}"
    echo -e "${GREEN}   ✅ Superadmin account active${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}║  ⚠️  Checks passed with warnings                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📋 System Status: FUNCTIONAL (with warnings)${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo -e "${YELLOW}   Review warnings above and take recommended actions${NC}"
else
    echo -e "${RED}║  ❌ Checks failed - action required                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}📋 System Status: ISSUES DETECTED${NC}"
    echo -e "${RED}   Errors: $ERRORS${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo -e "${RED}   Review errors above and fix immediately${NC}"
fi
echo ""

# Recommendations
echo -e "${BLUE}💡 Recommended Next Steps:${NC}"

if [ ! -d "./supabase_backups" ] || [ "$(ls -1 ./supabase_backups/*.dump 2>/dev/null | wc -l | xargs)" -eq 0 ]; then
    echo -e "${YELLOW}   1. Create initial backup: ./backup_supabase.sh${NC}"
fi

if [ -z "$CRON_OUTPUT" ]; then
    echo -e "${YELLOW}   2. Setup automated backups: ./setup_cron_backup.sh${NC}"
fi

if ! PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles ur
        JOIN auth.users u ON u.id = ur.user_id
        WHERE u.email = 'superadmin@yachtexcel.com'
        AND ur.role = 'superadmin'
    );" -t -A 2>/dev/null | grep -q "t"; then
    echo -e "${YELLOW}   3. Restore superadmin access: ./restore_superadmin.sh${NC}"
fi

echo -e "${BLUE}   4. Read documentation: cat DATABASE_OPERATIONS_GUIDE.md${NC}"
echo -e "${BLUE}   5. Test restore process: ./restore_supabase.sh${NC}"
echo ""

exit $ERRORS
