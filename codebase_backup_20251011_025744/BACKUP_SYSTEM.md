# Yacht Sentinel AI - Backup System Documentation

## Overview

This document describes the comprehensive backup and restore system for Yacht Sentinel AI. The system provides automated backups, manual backup/restore capabilities, and integration with database operations.

## 🎯 Critical Rule

**NEVER perform database operations (reset, migration, etc.) without creating a backup first!**

## Backup Scripts

### 1. `backup_supabase.sh` - Manual Backup Script

Creates a complete backup of your Supabase database.

**Usage:**
```bash
chmod +x backup_supabase.sh
./backup_supabase.sh
```

**What it backs up:**
- ✅ Full database (PostgreSQL custom format `.dump`)
- ✅ SQL text format (`.sql.gz` - compressed)
- ✅ Auth tables specifically (`auth.users`, `user_roles`)
- ✅ Backup manifest with metadata

**Backup location:** `./supabase_backups/`

**Retention:** 30 days (configurable)

**Output files:**
```
supabase_backups/
├── yacht_sentinel_20241010_143022.dump          # Full binary backup
├── yacht_sentinel_20241010_143022.sql.gz        # SQL text backup (compressed)
├── yacht_sentinel_20241010_143022_auth.sql.gz   # Auth tables only
└── yacht_sentinel_20241010_143022_manifest.txt  # Backup metadata
```

### 2. `restore_supabase.sh` - Database Restore Script

Restores database from a backup with safety checks.

**Usage:**
```bash
chmod +x restore_supabase.sh
./restore_supabase.sh
```

**Features:**
- 📋 Lists all available backups with dates and sizes
- 🔒 Safety confirmation required before restore
- 💾 Offers to create current database backup before restore
- 🔄 Automatically restores superadmin account after restore
- ✅ Verifies restoration success

**Process:**
1. Displays available backups
2. User selects backup to restore
3. Optionally creates safety backup of current state
4. Requires typing "RESTORE" to confirm
5. Performs restoration
6. Restores superadmin access automatically

### 3. `setup_cron_backup.sh` - Automated Backup Configuration

Sets up automated backups using cron.

**Usage:**
```bash
chmod +x setup_cron_backup.sh
./setup_cron_backup.sh
```

**Backup frequency options:**
1. **Hourly** - For active development (recommended for dev)
2. **Every 4 hours** - Moderate protection
3. **Every 6 hours** - Light protection
4. **Daily at 2:00 AM** - Production recommended
5. **Custom** - Define your own cron schedule

**Features:**
- ⏰ Automated scheduled backups
- 📝 Logs all backup operations to `cron_backup.log`
- 🔄 Updates existing cron jobs safely
- 💾 Creates initial backup immediately

## Quick Start Guide

### First-Time Setup

```bash
# Step 1: Make all scripts executable
chmod +x backup_supabase.sh restore_supabase.sh setup_cron_backup.sh restore_superadmin.sh

# Step 2: Create initial backup
./backup_supabase.sh

# Step 3: Setup automated backups
./setup_cron_backup.sh
# Select option 4 (Daily at 2:00 AM) for production
# Select option 1 (Hourly) for development

# Step 4: Verify cron is set up
crontab -l | grep backup
```

### Daily Workflow

**Before any database operation:**
```bash
# Always create a backup first!
./backup_supabase.sh
```

**Before migrations:**
```bash
# 1. Backup current state
./backup_supabase.sh

# 2. Run migration
npx supabase migration up

# 3. Restore superadmin (in case of issues)
./restore_superadmin.sh
```

**Before database reset:**
```bash
# 1. Backup current state
./backup_supabase.sh

# 2. Reset database
npx supabase db reset

# 3. IMMEDIATELY restore superadmin
./restore_superadmin.sh
```

**Restore from backup:**
```bash
./restore_supabase.sh
# Follow the interactive prompts
```

## Backup File Formats

### 1. `.dump` Files (PostgreSQL Custom Format)

**Best for:** Fast, reliable restoration

**Usage:**
```bash
pg_restore -h 127.0.0.1 -p 54322 -U postgres -d postgres -c yacht_sentinel_YYYYMMDD_HHMMSS.dump
```

**Advantages:**
- Binary format (faster)
- Supports parallel restoration
- Can restore individual tables
- Most reliable for full restoration

### 2. `.sql.gz` Files (Compressed SQL)

**Best for:** Version control, inspection, partial restoration

**Usage:**
```bash
gunzip -c yacht_sentinel_YYYYMMDD_HHMMSS.sql.gz | psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

**Advantages:**
- Human-readable when uncompressed
- Can edit before restoring
- Good for version control
- Can extract specific parts

### 3. `_auth.sql.gz` Files (Auth Tables Only)

**Best for:** Quick user/role restoration without full DB restore

**Usage:**
```bash
gunzip -c yacht_sentinel_YYYYMMDD_HHMMSS_auth.sql.gz | psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

**Advantages:**
- Fast restoration of user accounts
- Preserves authentication without affecting data
- Small file size
- Good for fixing auth issues

## Integration with Existing Scripts

### Updated `restore_superadmin.sh`

The superadmin restoration script now:
1. Checks for recent backups
2. Warns if no backup exists
3. Offers to create backup before proceeding
4. Integrates seamlessly with restore workflow

### Database Migration Workflow

```bash
#!/bin/bash
# Safe migration workflow

# 1. Create backup
./backup_supabase.sh

# 2. Run migration
npx supabase migration up

# 3. Verify migration
npx supabase db diff

# 4. Restore superadmin if needed
./restore_superadmin.sh
```

## Monitoring and Maintenance

### View Cron Backup Logs

```bash
# View all logs
cat cron_backup.log

# Follow logs in real-time
tail -f cron_backup.log

# View last backup
tail -n 50 cron_backup.log
```

### List All Backups

```bash
ls -lht supabase_backups/
```

### Check Backup Size

```bash
du -sh supabase_backups/
```

### Manual Cleanup (if needed)

```bash
# Remove backups older than 60 days
find supabase_backups/ -name "yacht_sentinel_*.dump" -mtime +60 -delete
find supabase_backups/ -name "yacht_sentinel_*.sql.gz" -mtime +60 -delete
```

### Verify Backup Integrity

```bash
# Test backup file (doesn't restore, just validates)
pg_restore --list supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump
```

## Disaster Recovery Scenarios

### Scenario 1: Accidental Data Loss

```bash
# 1. Stop making changes
# 2. Restore from most recent backup
./restore_supabase.sh
# Select the most recent backup

# 3. Verify data is restored
# Login and check critical data

# 4. If issues persist, try earlier backup
./restore_supabase.sh
# Select an older backup
```

### Scenario 2: Lost Superadmin Access

```bash
# Quick fix - restore superadmin only
./restore_superadmin.sh

# If that doesn't work - restore auth tables
gunzip -c supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS_auth.sql.gz | \
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### Scenario 3: Corrupted Database

```bash
# 1. Create backup of current state (even if corrupted)
./backup_supabase.sh

# 2. Full restore from known good backup
./restore_supabase.sh
# Select a backup from before corruption

# 3. Restore superadmin
./restore_superadmin.sh
```

### Scenario 4: Migration Gone Wrong

```bash
# 1. Check if backup was created before migration
ls -lht supabase_backups/ | head -5

# 2. Restore from pre-migration backup
./restore_supabase.sh
# Select backup from before migration

# 3. Fix migration script
# 4. Create new backup
./backup_supabase.sh

# 5. Try migration again
npx supabase migration up
```

## Best Practices

### ✅ DO

1. **Create backup before ANY database operation**
2. **Test restore process regularly** (monthly recommended)
3. **Keep at least 30 days of backups**
4. **Store critical backups off-site** (copy to cloud storage)
5. **Verify backup integrity periodically**
6. **Document any manual changes** to database
7. **Use automated cron backups** for development and production

### ❌ DON'T

1. **Never delete all backups** - keep at least one known good backup
2. **Don't skip backup before migrations**
3. **Don't ignore backup failures** - investigate immediately
4. **Don't restore without safety backup** of current state
5. **Don't rely solely on automated backups** - manual backups before critical operations
6. **Don't store backups only locally** - use off-site storage for production

## Backup Schedule Recommendations

### Development Environment

```
Automated: Hourly (via cron)
Manual: Before each migration or reset
Retention: 7-14 days
```

### Staging Environment

```
Automated: Every 4 hours
Manual: Before deployments
Retention: 30 days
```

### Production Environment

```
Automated: Daily at 2:00 AM + hourly incrementals
Manual: Before any schema change
Retention: 90 days full, 365 days auth-only
Off-site: Weekly to cloud storage
```

## Troubleshooting

### Backup Script Fails

```bash
# Check if Supabase is running
npx supabase status

# Check PostgreSQL is accessible
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT version();"

# Check disk space
df -h

# Check permissions
ls -la backup_supabase.sh
chmod +x backup_supabase.sh
```

### Restore Fails

```bash
# 1. Verify backup file exists and is readable
ls -lh supabase_backups/yacht_sentinel_*.dump

# 2. Check backup integrity
pg_restore --list supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump

# 3. Try restoring with verbose output
PGPASSWORD=postgres pg_restore -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  --clean --if-exists --verbose supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump
```

### Cron Job Not Running

```bash
# Check cron is enabled
crontab -l

# Check cron logs
tail -f cron_backup.log

# Test backup script manually
./backup_supabase.sh

# Verify cron daemon is running (macOS)
sudo launchctl list | grep cron

# Check system logs
grep CRON /var/log/syslog  # Linux
log show --predicate 'process == "cron"' --last 1h  # macOS
```

## File Structure

```
yacht-sentinel-ai-complete/
├── backup_supabase.sh           # Manual backup script
├── restore_supabase.sh          # Interactive restore script
├── setup_cron_backup.sh         # Automated backup setup
├── restore_superadmin.sh        # Superadmin restoration
├── cron_backup.log             # Cron backup logs
└── supabase_backups/           # Backup storage directory
    ├── yacht_sentinel_20241010_143022.dump
    ├── yacht_sentinel_20241010_143022.sql.gz
    ├── yacht_sentinel_20241010_143022_auth.sql.gz
    ├── yacht_sentinel_20241010_143022_manifest.txt
    └── ... (older backups)
```

## Summary

✅ **Three backup scripts** for different needs
✅ **Automated cron backups** prevent data loss
✅ **Interactive restore** with safety checks
✅ **Multiple backup formats** for flexibility
✅ **30-day retention** by default
✅ **Integrated with superadmin restoration**
✅ **Comprehensive documentation** for all scenarios

**Remember:** 
- Always backup before database operations
- Test your restore process regularly
- Keep backups off-site for production
- Monitor cron backup logs

---

**For questions or issues, check the troubleshooting section or review the script comments.**
