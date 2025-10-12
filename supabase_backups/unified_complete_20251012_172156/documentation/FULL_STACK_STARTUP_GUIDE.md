# 🚀 Yacht Sentinel AI - Full Stack Startup Guide

## ✅ System Successfully Started

The complete development stack is now running with the proper backup restored!

---

## 📊 Current System Status

### ✅ Running Services
- **Supabase**: `http://127.0.0.1:54321`
- **Database**: `localhost:54322`
- **Frontend**: `http://localhost:5173` ⚠️ *Note: Vite uses 5173, not 5174*
- **Tables**: 17 production tables loaded from backup

### 🔑 Login Credentials
```
Email:    superadmin@yachtexcel.com
Password: superadmin123
URL:      http://localhost:5173/login
```

---

## 🎯 Quick Commands

### Start Full Stack (Automated)
```bash
./start_full_stack.sh
```

**This script automatically:**
1. ✅ Stops any running services
2. ✅ Starts Supabase
3. ✅ Checks if database has proper tables
4. ✅ Restores from `yacht_sentinel_20251011_024733_COMPLETE.dump` if needed
5. ✅ Restores superadmin account
6. ✅ Starts frontend on port 5173
7. ✅ Verifies all services running

### Stop All Services
```bash
./stop_full_stack.sh
```

**This script:**
- Stops Supabase cleanly
- Kills Vite dev server
- Terminates all Node processes
- Cleans up orphaned processes

---

## 📦 Complete Backup Details

### Backup Location
```
supabase_backups/yacht_sentinel_20251011_024733_COMPLETE.dump
```

### Backup Contents
- **Database Dump**: Complete PostgreSQL database
- **Tables**: 17 production tables
- **Edge Functions**: 65+ edge functions
- **RLS Policies**: Complete row-level security policies
- **RPC Functions**: All stored procedures and functions
- **Triggers**: Database triggers
- **Superadmin**: Pre-configured superadmin account

### Backup Manifest
```
supabase_backups/backup_manifest_20251011_024733.txt
```

### Related Backups
- **Edge Functions**: `edge_functions_20251011_024733.tar.gz`
- **Migrations**: `migrations_20251011_024733.tar.gz`
- **RLS Policies**: `rls_policies_detailed_20251011_024733.sql`
- **Functions/Triggers**: `functions_triggers_20251011_024733.sql`

---

## 🛠️ Database Connection

### Connection String
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Connection Details
```
Host:     127.0.0.1
Port:     54322
User:     postgres
Password: postgres
Database: postgres
```

---

## 🔧 Troubleshooting

### Frontend Not Starting
```bash
# Kill any process using port 5173
lsof -ti:5173 | xargs kill -9

# Restart frontend only
npm run dev
```

### Supabase Not Starting
```bash
# Stop and restart Supabase
npx supabase stop
npx supabase start
```

### Database Missing Tables
The startup script automatically restores from backup if table count < 15.

**Manual restore:**
```bash
./start_full_stack.sh
# Script will detect and restore automatically
```

### Need Fresh Start
```bash
# Stop everything
./stop_full_stack.sh

# Wait 5 seconds
sleep 5

# Start everything fresh
./start_full_stack.sh
```

---

## 📝 Important Notes

### ⚠️ CRITICAL: Always Use Complete Backup
- **NEVER** create manual migrations
- **NEVER** reset database without restoring from backup
- **ALWAYS** use `./start_full_stack.sh` to start services
- **ALWAYS** verify table count is 17+ after startup

### Database State Verification
```bash
# Check table count
echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | \
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### Superadmin Verification
```bash
# Test login via API
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@yachtexcel.com",
    "password": "superadmin123"
  }'
```

---

## 🎉 Development Workflow

### Daily Startup
```bash
./start_full_stack.sh
```

### Development
1. Open browser to `http://localhost:5173`
2. Login with superadmin credentials
3. Frontend has hot-reload enabled
4. Database changes persist via Docker volumes

### Daily Shutdown
```bash
./stop_full_stack.sh
```

---

## 📚 Additional Resources

- **Backup System**: `BACKUP_SYSTEM_README.md`
- **Database Operations**: `DATABASE_OPERATIONS_GUIDE.md`
- **RLS Policies**: `RLS_POLICIES_UNIFICATION_SUMMARY.md`
- **Superadmin Management**: `SUPERADMIN_MANAGEMENT.md`

---

## ✅ Success Indicators

When everything is working correctly:
- ✅ Supabase starts without errors
- ✅ Database has 17+ tables
- ✅ Frontend loads at `http://localhost:5173`
- ✅ Superadmin can login
- ✅ No 404 errors in browser console
- ✅ All API endpoints return data

---

**Last Updated**: 2025-10-11  
**Backup Used**: yacht_sentinel_20251011_024733_COMPLETE.dump  
**System Status**: ✅ Fully Operational
