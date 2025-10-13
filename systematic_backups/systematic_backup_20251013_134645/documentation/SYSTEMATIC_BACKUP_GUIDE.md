# Systematic Backup System - Quick Reference

## 📦 Complete Backup System

The systematic backup system creates comprehensive backups including:
- ✅ **Database** (schema + all data)
- ✅ **Source Code** (Git commit + archive)
- ✅ **GitHub** (automatic push to remote)
- ✅ **Migrations** (complete history)
- ✅ **Edge Functions** (all Supabase functions)
- ✅ **Documentation** (all .md files)
- ✅ **Configuration** (package.json, tsconfig, etc.)

## 🚀 Quick Start

### Create a Complete Backup
```bash
./create_systematic_backup.sh
```

This single command will:
1. Backup the complete database
2. Commit all code changes to Git
3. Push to GitHub (if configured)
4. Archive source code
5. Backup migrations and edge functions
6. Create restore scripts

### Restore from Backup
```bash
cd systematic_backups/systematic_backup_YYYYMMDD_HHMMSS/
./restore_database.sh      # Database only
./restore_complete.sh      # Full system
```

## 📋 Backup Components

### 1. Database Backup
- **Binary format**: `database_complete.dump` (optimized for restore)
- **SQL format**: `database_complete.sql` (human-readable)
- Includes all tables, data, functions, triggers, views

### 2. Source Code Backup
- **Git commit**: All changes committed with timestamp
- **Archive**: `source_code.tar.gz` (excludes node_modules, build artifacts)
- **Commit hash**: Recorded in manifest

### 3. GitHub Backup
- **Automatic push**: Code pushed to GitHub remote (if configured)
- **Branch tracking**: Current branch recorded
- **Status**: Success/failed/skipped tracked in manifest

### 4. Additional Backups
- **Migrations**: Complete migration history from `supabase/migrations/`
- **Edge Functions**: All functions from `supabase/functions/`
- **Documentation**: All .md files
- **Configuration**: package.json, tsconfig.json, vite.config.ts, etc.

## 🔧 Setup GitHub Remote (First Time)

If you haven't set up GitHub yet:

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

After setup, the backup script will automatically push to GitHub.

## 📊 Backup Structure

```
systematic_backups/
└── systematic_backup_20241013_143025/
    ├── BACKUP_MANIFEST.md          # Complete backup details
    ├── database_complete.dump      # Binary database backup
    ├── database_complete.sql       # SQL database backup
    ├── source_code.tar.gz          # Complete source archive
    ├── migrations/                 # All migration files
    ├── functions/                  # All edge functions
    ├── documentation/              # All .md files
    ├── config/                     # Configuration files
    ├── restore_database.sh         # Quick database restore
    └── restore_complete.sh         # Full system restore
```

## 🔄 Common Operations

### Daily Backup
```bash
# Run before end of day
./create_systematic_backup.sh
```

### Before Major Changes
```bash
# Create backup before risky operations
./create_systematic_backup.sh
```

### After Important Work
```bash
# Backup after completing features
./create_systematic_backup.sh
```

### Automated Backups
Set up a cron job for automatic backups:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/yacht-sentinel-ai-complete && ./create_systematic_backup.sh
```

## 🔍 Verify Backup

After creating a backup, check the manifest:
```bash
cat systematic_backups/systematic_backup_*/BACKUP_MANIFEST.md
```

Look for:
- ✅ Database backup size
- ✅ Source code size  
- ✅ GitHub push status
- ✅ Migration count
- ✅ Function count

## 🚨 Emergency Restore

### Complete System Lost
```bash
# 1. Clone from GitHub
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# 2. Install dependencies
npm install

# 3. Start Supabase
npx supabase start

# 4. Find latest backup
cd systematic_backups
ls -lt | head

# 5. Restore database
cd systematic_backup_YYYYMMDD_HHMMSS
./restore_database.sh
```

### Database Corruption
```bash
cd systematic_backups/systematic_backup_YYYYMMDD_HHMMSS/
./restore_database.sh
```

### Code Changes Lost
```bash
# Restore from Git
git reset --hard <commit-hash>

# Or extract from archive
tar -xzf systematic_backups/systematic_backup_*/source_code.tar.gz
```

## 🎯 Best Practices

1. **Backup Before Changes**: Always backup before major modifications
2. **Verify GitHub**: Check GitHub push succeeds after first setup
3. **Test Restore**: Periodically test restore process
4. **Keep Backups**: Don't delete old backups immediately
5. **Multiple Locations**: Backup copies to external drive/cloud

## 🔐 What Gets Backed Up

### ✅ Included
- All database tables and data
- All source code files
- Git commit history
- Migrations and schemas
- Edge functions
- Documentation
- Configuration files
- Encrypted API keys (in database)

### ❌ Excluded (from code archive)
- node_modules (can be reinstalled)
- .git directory (already in GitHub)
- dist/build directories (generated)
- .next, coverage, .turbo (build artifacts)
- Other backup directories (prevents recursion)

## 📞 Troubleshooting

### "No GitHub remote configured"
```bash
git remote add origin <your-github-url>
git push -u origin main
```

### "GitHub push failed"
```bash
# Check credentials
git config --list | grep user

# Re-authenticate
gh auth login
```

### "Database restore failed"
```bash
# Check Supabase is running
npx supabase status

# Try SQL format instead
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f database_complete.sql
```

## 🌟 Advanced Usage

### Backup to External Drive
```bash
./create_systematic_backup.sh
cp -r systematic_backups/* /Volumes/ExternalDrive/backups/
```

### Backup to Cloud
```bash
./create_systematic_backup.sh
# Then sync to cloud
rclone sync systematic_backups/ remote:backups/
```

### Compare Backups
```bash
# List all backups
ls -lh systematic_backups/

# Compare manifest files
diff systematic_backups/systematic_backup_20241013_100000/BACKUP_MANIFEST.md \
     systematic_backups/systematic_backup_20241013_140000/BACKUP_MANIFEST.md
```

## 📚 Additional Resources

- Full backup details: Check `BACKUP_MANIFEST.md` in each backup directory
- Database documentation: See `supabase/migrations/` for schema history
- API documentation: Check `*.md` files in documentation directory

---

**Created by**: Systematic Backup System
**Purpose**: Zero data loss, comprehensive backup solution
**Supports**: Database + Code + GitHub + Full System
