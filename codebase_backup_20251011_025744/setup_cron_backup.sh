#!/bin/bash

# Automated Cron Backup System for Yacht Sentinel AI
# This script sets up automated backups using cron

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$SCRIPT_DIR/backup_supabase.sh"
CRON_LOG="$SCRIPT_DIR/cron_backup.log"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Cron Backup Setup              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo -e "${RED}❌ Backup script not found: ${BACKUP_SCRIPT}${NC}"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo -e "${GREEN}✅ Backup script is executable${NC}"

# Check current crontab
echo -e "${BLUE}📋 Checking current cron jobs...${NC}"
CURRENT_CRON=$(crontab -l 2>/dev/null || true)

# Check if backup job already exists
if echo "$CURRENT_CRON" | grep -q "backup_supabase.sh"; then
    echo -e "${YELLOW}⚠️  Backup cron job already exists${NC}"
    echo ""
    echo -e "${BLUE}Current backup schedule:${NC}"
    echo "$CURRENT_CRON" | grep "backup_supabase.sh"
    echo ""
    echo -e "${BLUE}Do you want to update it? [y/N]:${NC} "
    read update_cron
    
    if [[ ! "$update_cron" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Setup cancelled${NC}"
        exit 0
    fi
    
    # Remove existing backup jobs
    CURRENT_CRON=$(echo "$CURRENT_CRON" | grep -v "backup_supabase.sh" || true)
fi

echo ""
echo -e "${BLUE}Select backup frequency:${NC}"
echo -e "${YELLOW}[1]${NC} Every hour (recommended for development)"
echo -e "${YELLOW}[2]${NC} Every 4 hours"
echo -e "${YELLOW}[3]${NC} Every 6 hours"
echo -e "${YELLOW}[4]${NC} Daily at 2:00 AM (recommended for production)"
echo -e "${YELLOW}[5]${NC} Custom cron expression"
echo ""
echo -e "${BLUE}Select option [1-5]:${NC} "
read frequency

case $frequency in
    1)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="hourly"
        ;;
    2)
        CRON_SCHEDULE="0 */4 * * *"
        DESCRIPTION="every 4 hours"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="every 6 hours"
        ;;
    4)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="daily at 2:00 AM"
        ;;
    5)
        echo -e "${BLUE}Enter custom cron expression (e.g., '0 2 * * *'):${NC} "
        read CRON_SCHEDULE
        DESCRIPTION="custom schedule"
        ;;
    *)
        echo -e "${RED}❌ Invalid selection${NC}"
        exit 1
        ;;
esac

# Create new crontab with backup job
echo -e "${BLUE}🔄 Setting up cron job...${NC}"

# Build new cron entry
NEW_CRON_ENTRY="$CRON_SCHEDULE cd $SCRIPT_DIR && $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

# Add to existing crontab
if [ -z "$CURRENT_CRON" ]; then
    echo "$NEW_CRON_ENTRY" | crontab -
else
    (echo "$CURRENT_CRON"; echo "$NEW_CRON_ENTRY") | crontab -
fi

echo -e "${GREEN}✅ Cron job created successfully!${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Automated backup system configured!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Backup Schedule:${NC} $DESCRIPTION"
echo -e "${YELLOW}📝 Cron Expression:${NC} $CRON_SCHEDULE"
echo -e "${YELLOW}📁 Backup Location:${NC} $SCRIPT_DIR/supabase_backups/"
echo -e "${YELLOW}📄 Cron Log:${NC} $CRON_LOG"
echo ""
echo -e "${BLUE}Current crontab:${NC}"
crontab -l | grep backup_supabase
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   - View cron log: tail -f $CRON_LOG"
echo -e "   - Manual backup: $BACKUP_SCRIPT"
echo -e "   - Disable cron: crontab -e (remove the backup line)"
echo -e "   - List cron jobs: crontab -l"
echo ""

# Create initial backup
echo -e "${BLUE}Do you want to create an initial backup now? [Y/n]:${NC} "
read create_now

if [[ ! "$create_now" =~ ^[Nn]$ ]]; then
    echo ""
    $BACKUP_SCRIPT
fi
