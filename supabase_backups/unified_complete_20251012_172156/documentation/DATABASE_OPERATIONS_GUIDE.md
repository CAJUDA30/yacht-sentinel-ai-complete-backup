# Database Operations Guide - Yacht Sentinel AI

## 🚨 CRITICAL RULE

**NEVER perform database operations without creating a backup first!**

This guide ensures you never lose data during development, migrations, or database resets.

---

## Quick Reference Card

### Before ANY Database Operation

```bash
# STEP 1: Create backup (ALWAYS!)
./backup_supabase.sh

# STEP 2: Perform operation
# (migration, reset, etc.)

# STEP 3: Restore superadmin if needed
./restore_superadmin.sh
```

---

## Available Scripts

All scripts are executable and located in the project root:

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup_supabase.sh` | Create manual backup | `./backup_supabase.sh` |
| `restore_supabase.sh` | Restore from backup | `./restore_supabase.sh` |
| `setup_cron_backup.sh` | Setup automated backups | `./setup_cron_backup.sh` |
| `restore_superadmin.sh` | Restore superadmin access | `./restore_superadmin.sh` |

---

## Common Database Operations

### 1. Database Reset

**Problem:** Database resets wipe all data including superadmin account

**Solution:**
```bash
# Step 1: Create backup
./backup_supabase.sh

# Step 2: Reset database
npx supabase db reset

# Step 3: Restore superadmin (IMMEDIATELY!)
./restore_superadmin.sh
```

**Output you should see:**
```
✅ Backup completed successfully!
✅ Database reset completed
✅ Superadmin account restored successfully!
```

### 2. Running Migrations

**Problem:** Migrations can fail and corrupt data

**Solution:**
```bash
# Step 1: Create backup
./backup_supabase.sh

# Step 2: Run migration
npx supabase migration up

# Step 3: Verify migration
npx supabase db diff

# Step 4: Restore superadmin if needed
./restore_superadmin.sh

# Step 5: If migration failed, restore from backup
# ./restore_supabase.sh
```

### 3. Creating New Migration

**Problem:** Need to test migration before applying

**Solution:**
```bash
# Step 1: Create backup of current state
./backup_supabase.sh

# Step 2: Create migration file
npx supabase migration new your_migration_name

# Step 3: Edit migration file
# Edit: supabase/migrations/YYYYMMDD_your_migration_name.sql

# Step 4: Test migration
npx supabase db reset  # Applies all migrations fresh

# Step 5: Restore superadmin
./restore_superadmin.sh

# Step 6: Verify everything works
# If broken, restore from backup:
# ./restore_supabase.sh
```

### 4. Schema Changes

**Problem:** Direct schema changes can break the app

**Solution:**
```bash
# Step 1: Backup current state
./backup_supabase.sh

# Step 2: Make schema changes via Supabase Studio or SQL

# Step 3: Generate migration from changes
npx supabase db diff -f your_change_name

# Step 4: Review generated migration
cat supabase/migrations/YYYYMMDD_your_change_name.sql

# Step 5: Restore superadmin if needed
./restore_superadmin.sh
```

### 5. Disaster Recovery

**Problem:** Database is corrupted or data was accidentally deleted

**Solution:**
```bash
# Step 1: Stop making changes immediately!

# Step 2: List available backups
ls -lht ./supabase_backups/

# Step 3: Restore from backup
./restore_supabase.sh

# Step 4: Select the backup BEFORE the problem occurred

# Step 5: Verify data is restored correctly
```

---

## Automated Backup Setup

### First-Time Setup (DO THIS NOW!)

```bash
# Step 1: Setup automated backups
./setup_cron_backup.sh

# Step 2: Select backup frequency
# For development: Option 1 (Hourly)
# For production: Option 4 (Daily at 2:00 AM)

# Step 3: Verify cron is set up
crontab -l | grep backup

# Step 4: Check cron logs later
tail -f cron_backup.log
```

### Recommended Backup Schedules

**Development Environment:**
- Frequency: Hourly
- Retention: 7-14 days
- Reason: Frequent changes, need recovery points

**Staging Environment:**
- Frequency: Every 4 hours
- Retention: 30 days
- Reason: Balance between protection and storage

**Production Environment:**
- Frequency: Daily at 2:00 AM + hourly during business hours
- Retention: 90 days
- Reason: Critical data protection

---

## Backup File Structure

```
./supabase_backups/
├── yacht_sentinel_20251011_002134.dump          # Full database (binary)
├── yacht_sentinel_20251011_002134.sql.gz        # Full database (SQL text, compressed)
├── yacht_sentinel_20251011_002134_auth.sql.gz   # Auth tables only (compressed)
└── yacht_sentinel_20251011_002134_manifest.txt  # Backup metadata

Older backups...
├── yacht_sentinel_20251010_140000.dump
├── yacht_sentinel_20251010_140000.sql.gz
└── ...
```

### File Purposes

| File Type | Purpose | When to Use |
|-----------|---------|-------------|
| `.dump` | Fast, reliable full restore | Default restoration method |
| `.sql.gz` | Human-readable, editable | Inspect changes, partial restore |
| `_auth.sql.gz` | Quick auth restoration | Restore users without touching data |
| `_manifest.txt` | Backup metadata | Identify backup contents |

---

## Superadmin Account Management

### Current Credentials

```
Email:    superadmin@yachtexcel.com
Password: admin123
URL:      http://localhost:5173/superadmin
```

### When Superadmin Access is Lost

**Immediate Fix:**
```bash
./restore_superadmin.sh
```

**This script:**
1. Checks if backup system is active
2. Shows latest backup info
3. Creates or updates superadmin user
4. Sets password to `admin123`
5. Grants superadmin role in `user_roles` table
6. Verifies restoration success

**Expected output:**
```
✅ Backup system active
   Latest backup: yacht_sentinel_20251011_002134.dump
   Created: 2025-10-11 00:21:34
   Total backups: 1

✅ User found with ID: 339e3acc-a5a0-43ff-ae07-924fc32a292a
✅ User updated successfully
✅ Superadmin account restored successfully!
```

---

## Troubleshooting

### Backup Fails

```bash
# Check if Supabase is running
npx supabase status

# Check if PostgreSQL is accessible
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT version();"

# Check disk space
df -h

# Check script permissions
ls -la backup_supabase.sh
chmod +x backup_supabase.sh
```

### Restore Fails

```bash
# Verify backup file exists
ls -lh ./supabase_backups/yacht_sentinel_*.dump

# Check backup integrity
pg_restore --list ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump

# Try verbose restore
PGPASSWORD=postgres pg_restore -h 127.0.0.1 -p 54322 -U postgres \
  -d postgres --clean --if-exists --verbose \
  ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump
```

### Cron Not Running

```bash
# Check if cron job exists
crontab -l

# View cron logs
tail -f cron_backup.log

# Test backup script manually
./backup_supabase.sh

# Check if cron daemon is running (macOS)
sudo launchctl list | grep cron
```

### Superadmin Restore Fails

```bash
# Check if Supabase Auth is running
curl -X GET "http://127.0.0.1:54321/auth/v1/health"

# Manually restore from auth backup
gunzip -c ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS_auth.sql.gz | \
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres

# Then run restore script again
./restore_superadmin.sh
```

---

## Integration with Development Workflow

### Daily Development

```bash
# Morning: Start Supabase
npx supabase start

# Before making changes: Create backup
./backup_supabase.sh

# Make your changes...

# If something breaks: Restore
./restore_supabase.sh

# Evening: Backups are created automatically by cron
```

### Before Pushing Code

```bash
# Step 1: Create backup of current state
./backup_supabase.sh

# Step 2: Test migrations on fresh DB
npx supabase db reset

# Step 3: Restore superadmin
./restore_superadmin.sh

# Step 4: Verify everything works

# Step 5: If tests pass, commit and push
git add .
git commit -m "Your changes"
git push
```

### When Pulling Changes

```bash
# Step 1: Backup current state
./backup_supabase.sh

# Step 2: Pull changes
git pull

# Step 3: Run new migrations
npx supabase migration up

# Step 4: Restore superadmin if needed
./restore_superadmin.sh

# Step 5: If broken, restore from backup
# ./restore_supabase.sh
```

---

## Best Practices Checklist

- [ ] **Automated backups are set up** (`./setup_cron_backup.sh` completed)
- [ ] **Initial backup created** (`./backup_supabase.sh` run at least once)
- [ ] **Superadmin access verified** (can login at `/superadmin`)
- [ ] **Backup before migrations** (always run `./backup_supabase.sh` first)
- [ ] **Backup before resets** (CRITICAL - prevents data loss)
- [ ] **Test restore process** (run `./restore_supabase.sh` to verify)
- [ ] **Monitor cron logs** (check `cron_backup.log` weekly)
- [ ] **Keep 30+ days of backups** (default retention)
- [ ] **Document manual changes** (note any direct DB modifications)
- [ ] **Store backups off-site** (for production, copy to cloud storage)

---

## Quick Command Reference

```bash
# Create backup
./backup_supabase.sh

# Restore from backup (interactive)
./restore_supabase.sh

# Setup automated backups
./setup_cron_backup.sh

# Restore superadmin
./restore_superadmin.sh

# List backups
ls -lht ./supabase_backups/

# View backup manifest
cat ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS_manifest.txt

# Check cron jobs
crontab -l | grep backup

# View cron logs
tail -f cron_backup.log

# Verify backup integrity
pg_restore --list ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump

# Manual restore (full)
PGPASSWORD=postgres pg_restore -h 127.0.0.1 -p 54322 -U postgres -d postgres -c ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS.dump

# Manual restore (auth only)
gunzip -c ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS_auth.sql.gz | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

---

## Documentation Files

- **BACKUP_SYSTEM.md** - Complete backup system documentation
- **SUPERADMIN_MANAGEMENT.md** - Superadmin account management guide
- **DATABASE_OPERATIONS_GUIDE.md** - This file (quick reference)

---

## Summary

✅ **Four executable scripts** for complete backup/restore workflow
✅ **Automated cron backups** prevent data loss
✅ **Interactive restore** with safety checks
✅ **Superadmin restoration** integrated with backup system
✅ **30-day retention** by default
✅ **Multiple backup formats** for flexibility
✅ **Comprehensive documentation** for all scenarios

**Remember the golden rule:**
> **ALWAYS run `./backup_supabase.sh` before ANY database operation!**

---

**For detailed information, see:**
- [BACKUP_SYSTEM.md](./BACKUP_SYSTEM.md) - Full backup system docs
- [SUPERADMIN_MANAGEMENT.md](./SUPERADMIN_MANAGEMENT.md) - Superadmin guide
