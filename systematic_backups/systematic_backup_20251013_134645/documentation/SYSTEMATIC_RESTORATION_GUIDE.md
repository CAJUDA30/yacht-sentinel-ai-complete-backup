# 🔄 SYSTEMATIC RESTORATION GUIDE - Yacht Sentinel AI

## 🎯 Complete System Restoration Procedures

This guide provides systematic procedures to restore the Yacht Sentinel AI application to its fully functional state as of October 11, 2025, including all critical authentication fixes and comprehensive backups.

## 📁 Available Backups

### 1. **Supabase Complete Backup**
- **Location**: `supabase_backups/complete_20251011_025727/`
- **Size**: 1.6M
- **Contents**: Complete database dump, RLS policies, RPC functions, Edge functions, auth users, user roles, configuration files, migrations
- **Restoration Script**: `supabase_backups/complete_20251011_025727/restore_complete_backup.sh`

### 2. **Codebase Backup**
- **Location**: `codebase_backup_20251011_025744/`
- **Contents**: Complete source code with all authentication fixes, excluding node_modules and build artifacts
- **Authentication Fixes Summary**: `codebase_backup_20251011_025744/AUTHENTICATION_FIXES_SUMMARY.md`

### 3. **GitHub Repository**
- **Repository**: https://github.com/CAJUDA30/yacht-sentinel-ai-complete-backup.git
- **Commit**: Latest commit includes all authentication fixes and comprehensive backups
- **Branch**: `main`

## 🚀 Quick Restoration Procedures

### Option 1: Complete Fresh Installation

```bash
# 1. Clone from GitHub
git clone https://github.com/CAJUDA30/yacht-sentinel-ai-complete-backup.git
cd yacht-sentinel-ai-complete-backup

# 2. Install dependencies
npm install

# 3. Ensure Docker Desktop is running
open -a "Docker Desktop"

# 4. Restore Supabase
cd supabase_backups/complete_20251011_025727
./restore_complete_backup.sh

# 5. Start development stack
cd ../..
supabase start
npm run dev
```

### Option 2: Restore from Local Backups

```bash
# 1. Navigate to project directory
cd /Users/carlosjulia/yacht-sentinel-ai-complete

# 2. Restore codebase (if needed)
rsync -av codebase_backup_20251011_025744/ . --exclude=codebase_backup_20251011_025744

# 3. Restore Supabase
cd supabase_backups/complete_20251011_025727
./restore_complete_backup.sh

# 4. Start development stack
cd ../..
supabase start
npm run dev
```

## 🔧 Systematic Development Stack Startup

Following the established memory workflow:

```bash
# 1. Ensure Docker Desktop is running
open -a "Docker Desktop"
sleep 10  # Wait for Docker to fully start

# 2. Stop any conflicting processes
pkill -f "vite|supabase"

# 3. Reset Supabase environment
supabase stop
supabase start

# 4. Start React development server
npm run dev
```

**Expected URLs**:
- Main App: http://localhost:5173/
- Supabase Studio: http://127.0.0.1:54323

## 🔐 Authentication System Verification

After restoration, verify the authentication fixes:

### 1. **Router-Level Auth Guard**
- Visit `http://localhost:5173/` without authentication
- **Expected**: Immediate redirect to `/auth` with "Initializing application..." loading
- **No**: Flash of main app content or component-level loading

### 2. **Superadmin Role Persistence**
- Login as `superadmin@yachtexcel.com`
- Navigate to any page and refresh multiple times
- **Expected**: Role remains "superadmin", no "verifying user role" messages
- **Verify**: Access to SuperAdmin page and all privileged functions

### 3. **Database Integration**
- Check `user_roles` table has superadmin entry
- Verify `is_superadmin()` RPC function returns true
- Confirm all RLS policies allow superadmin access

## 🗄️ Database Restoration Details

The Supabase backup includes:

### Schema & Data
- **Complete database dump**: All tables, indexes, constraints
- **User data**: Auth users, roles, permissions
- **Application data**: All yacht profiles, configurations, settings

### Security & Permissions
- **70+ RLS policies**: Unified and tested
- **15 RPC functions**: Including `is_superadmin()` 
- **Authentication setup**: Complete auth schema

### Edge Functions
- **73 Edge functions**: All AI processors, integrations, utilities
- **Shared modules**: Enterprise auth, logging, response handling
- **Configuration**: All edge function settings and dependencies

## 🛠️ Troubleshooting Common Issues

### Authentication Not Working
```bash
# Clear auth state and restart
supabase auth clear
supabase stop
supabase start
npm run dev
```

### Database Connection Issues
```bash
# Reset database completely
supabase db reset
cd supabase_backups/complete_20251011_025727
./restore_complete_backup.sh
```

### Edge Functions Not Deploying
```bash
# Redeploy all functions
supabase functions deploy --no-verify-jwt
```

## 📋 Critical Files & Components

### Authentication System Files
1. `src/App.tsx` - RouterAuthGuard implementation
2. `src/contexts/SuperAdminContext.tsx` - 4-method detection system
3. `src/hooks/useSupabaseAuth.ts` - Global auth state management
4. `src/hooks/useIsSuperadmin.ts` - Single source of truth
5. `src/components/auth/ProtectedRoute.tsx` - Route protection

### Database Schema Files
1. `supabase/migrations/` - All database migrations (15 files)
2. `supabase/functions/` - All Edge functions (73 functions)
3. Database backup: `yacht_sentinel_complete_20251011_025727_complete.dump`

## 🔍 Verification Checklist

After restoration, verify:

- [ ] App starts without errors at http://localhost:5173/
- [ ] Unauthenticated users immediately redirect to `/auth`
- [ ] Superadmin login works with `superadmin@yachtexcel.com`
- [ ] Superadmin role persists across page refreshes
- [ ] All main navigation items accessible
- [ ] Supabase Studio accessible at http://127.0.0.1:54323
- [ ] Database contains all expected tables and data
- [ ] RLS policies properly enforce access control
- [ ] Edge functions respond correctly

## 🎯 System State Summary

This restoration package represents:

**✅ Production-Ready Authentication System**
- Fixed all role persistence issues
- Eliminated conflicting detection systems
- Professional user experience with proper loading states

**✅ Complete Database Infrastructure**
- 70+ unified RLS policies
- 73 Edge functions for AI processing
- Comprehensive user role system

**✅ Systematic Backup Strategy**
- Multiple restoration pathways
- Complete documentation
- Enterprise-grade procedures

## 📞 Emergency Recovery

If standard procedures fail:

1. **Nuclear Option**: Complete fresh clone from GitHub
2. **Database Reset**: Use `supabase db reset` + restore script
3. **Clean Installation**: Delete all local files, fresh git clone
4. **Docker Reset**: Reset Docker Desktop, restart all containers

This system represents the culmination of systematic authentication fixes and comprehensive backup infrastructure, ensuring the Yacht Sentinel AI application can always be restored to a fully functional state.