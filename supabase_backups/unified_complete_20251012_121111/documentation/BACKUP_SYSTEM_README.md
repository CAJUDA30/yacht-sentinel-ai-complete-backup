# 🔐 Yacht Sentinel AI - Backup System

## ✅ System Status: READY

Your comprehensive backup and disaster recovery system is fully configured and operational!

---

## 🚀 Quick Start (First Time)

```bash
# 1. Verify system is ready
./verify_backup_system.sh

# 2. Create your first backup
./backup_supabase.sh

# 3. Setup automated backups (RECOMMENDED)
./setup_cron_backup.sh
# Select option 1 (Hourly) for development
# Select option 4 (Daily at 2AM) for production

# 4. Test the restore process
./restore_supabase.sh
# (Don't worry - it will ask for confirmation)
```

---

## 📋 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **`backup_supabase.sh`** | Create full database backup | Before ANY database operation |
| **`restore_supabase.sh`** | Restore from backup (interactive) | When data is lost or corrupted |
| **`setup_cron_backup.sh`** | Configure automated backups | One-time setup for automatic protection |
| **`restore_superadmin.sh`** | Restore superadmin access | When admin account is lost |
| **`verify_backup_system.sh`** | Check system health | Verify everything is configured correctly |

---

## ⚡ Common Tasks

### Before Database Reset
```bash
./backup_supabase.sh          # Create backup
npx supabase db reset         # Reset database
./restore_superadmin.sh       # Restore admin access
```

### Before Migration
```bash
./backup_supabase.sh          # Create backup
npx supabase migration up     # Run migration
./restore_superadmin.sh       # Restore admin if needed
```

### Disaster Recovery
```bash
./restore_supabase.sh         # Interactive restore
# Select backup from before the problem
```

### Lost Admin Access
```bash
./restore_superadmin.sh       # Quick fix
# Email: superadmin@yachtexcel.com
# Password: admin123
```

---

## 📦 What Gets Backed Up

Each backup creates **4 files**:

1. **`.dump`** - Full database (PostgreSQL binary format)
   - Fastest to restore
   - Most reliable
   - Use this for full recovery

2. **`.sql.gz`** - Full database (SQL text, compressed)
   - Human-readable when uncompressed
   - Can edit before restoring
   - Good for version control

3. **`_auth.sql.gz`** - Auth tables only (compressed)
   - Quick user/role restoration
   - Doesn't affect data
   - Use for fixing auth issues

4. **`_manifest.txt`** - Backup metadata
   - Backup details and timestamps
   - Restore instructions
   - Verification info

---

## 🎯 The Golden Rule

> **ALWAYS run `./backup_supabase.sh` BEFORE any database operation!**

This includes:
- ❌ Database resets (`npx supabase db reset`)
- ❌ Running migrations (`npx supabase migration up`)
- ❌ Schema changes
- ❌ Direct SQL modifications
- ❌ Testing destructive operations

**Exception:** Regular app usage (adding yachts, processing documents, etc.) is protected by automated backups.

---

## 🔄 Automated Backups

Your system is configured with cron jobs for automated backups:

```bash
# Check current schedule
crontab -l | grep backup

# View backup logs
tail -f cron_backup.log

# List all backups
ls -lht ./supabase_backups/
```

**Current Setup:**
- ✅ Cron jobs are active
- ✅ Logs are written to `cron_backup.log`
- ✅ Backups stored in `./supabase_backups/`
- ✅ 30-day automatic cleanup

---

## 📊 Backup Status

Run anytime to check system health:

```bash
./verify_backup_system.sh
```

**What it checks:**
1. ✅ All scripts are executable
2. ✅ Backup directory exists with backups
3. ✅ Automated backups configured
4. ✅ Supabase is running
5. ✅ Superadmin account is active
6. ✅ Documentation is available
7. ✅ Sufficient disk space

---

## 🆘 Emergency Procedures

### Data Lost/Corrupted
```bash
# 1. STOP making changes immediately
# 2. Run restore
./restore_supabase.sh
# 3. Select backup from before problem occurred
# 4. Verify data is correct
```

### Can't Login as Superadmin
```bash
# Quick fix
./restore_superadmin.sh

# If that doesn't work, restore auth tables
gunzip -c ./supabase_backups/yacht_sentinel_YYYYMMDD_HHMMSS_auth.sql.gz | \
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### Migration Failed
```bash
# 1. Check for backup before migration
ls -lht ./supabase_backups/ | head -5

# 2. Restore from pre-migration backup
./restore_supabase.sh

# 3. Fix migration script
# 4. Create new backup
./backup_supabase.sh

# 5. Try migration again
npx supabase migration up
```

### Backup Failed
```bash
# 1. Check Supabase status
npx supabase status

# 2. Verify database connection
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT version();"

# 3. Check disk space
df -h

# 4. Try backup again
./backup_supabase.sh
```

---

## 📚 Documentation

**Full Documentation:**
- **[DATABASE_OPERATIONS_GUIDE.md](./DATABASE_OPERATIONS_GUIDE.md)** - Complete workflow guide
- **[BACKUP_SYSTEM.md](./BACKUP_SYSTEM.md)** - Detailed backup system documentation
- **[SUPERADMIN_MANAGEMENT.md](./SUPERADMIN_MANAGEMENT.md)** - Superadmin account management

**Quick Reference:**
- All scripts have `--help` or comments explaining usage
- Each backup includes a manifest file with restore instructions
- Cron logs show automated backup history

---

## ✅ Verification Checklist

Use this checklist to verify your backup system is ready:

- [ ] Run `./verify_backup_system.sh` - all checks pass
- [ ] At least one backup exists in `./supabase_backups/`
- [ ] Automated backups configured (check `crontab -l`)
- [ ] Can login as superadmin@yachtexcel.com / admin123
- [ ] Have tested restore process at least once
- [ ] Team knows to always backup before database operations
- [ ] Cron logs are being written (`tail cron_backup.log`)
- [ ] Backups are less than 24 hours old

---

## 💡 Best Practices

### DO ✅
- Create backup before ANY database operation
- Test restore process monthly
- Keep 30+ days of backups
- Monitor cron backup logs weekly
- Store critical backups off-site (production)
- Document manual database changes

### DON'T ❌
- Never delete all backups
- Don't skip backup before migrations
- Don't ignore backup failures
- Don't restore without safety backup of current state
- Don't rely solely on automated backups for critical operations

---

## 🎓 Learning Resources

### Try These Exercises

1. **Create and verify a backup:**
   ```bash
   ./backup_supabase.sh
   pg_restore --list ./supabase_backups/yacht_sentinel_*.dump | head -20
   ```

2. **Practice restore (safe):**
   ```bash
   # This will ask for confirmation, so it's safe to try
   ./restore_supabase.sh
   # Press Ctrl+C to cancel or follow through to test
   ```

3. **Check automated backups:**
   ```bash
   crontab -l
   tail -f cron_backup.log
   ```

4. **Test superadmin restoration:**
   ```bash
   ./restore_superadmin.sh
   # Login at http://localhost:5173/superadmin
   ```

---

## 📞 Support

### Common Questions

**Q: How often should I create manual backups?**
A: Before every database operation (migration, reset, schema change).

**Q: How long are backups kept?**
A: 30 days by default (configurable in `backup_supabase.sh`).

**Q: Can I restore just the auth tables?**
A: Yes! Use the `_auth.sql.gz` file: 
```bash
gunzip -c backup_auth.sql.gz | psql [connection params]
```

**Q: What if restore fails?**
A: Try earlier backups. Check `BACKUP_SYSTEM.md` troubleshooting section.

**Q: Do automated backups run while I'm working?**
A: Yes, cron runs in the background without interrupting your work.

---

## 🎉 Summary

Your Yacht Sentinel AI backup system provides:

✅ **Manual backups** via `backup_supabase.sh`
✅ **Automated backups** via cron jobs  
✅ **Interactive restore** with safety checks  
✅ **Superadmin recovery** anytime  
✅ **Multiple backup formats** for flexibility  
✅ **30-day retention** automatically managed  
✅ **Comprehensive documentation** for all scenarios  
✅ **Verification tools** to ensure system health  

**You are now protected from data loss!**

---

## 🚦 System Health

Run verification anytime:
```bash
./verify_backup_system.sh
```

Current status from last check:
```
✅ All scripts executable
✅ Backups configured  
✅ Database accessible
✅ Superadmin account active
📊 Disk usage: 7% (sufficient space)
```

---

**Remember:** Always backup before database operations! 🔐

For detailed information, see [DATABASE_OPERATIONS_GUIDE.md](./DATABASE_OPERATIONS_GUIDE.md)
