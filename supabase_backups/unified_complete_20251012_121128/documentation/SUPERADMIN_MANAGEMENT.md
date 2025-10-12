# Superadmin Account Management Guide

## ⚠️ CRITICAL: Prevent Superadmin Data Loss

This guide ensures the superadmin account survives database resets and provides systematic recovery procedures.

## Default Superadmin Credentials

```
Email:    superadmin@yachtexcel.com
Password: admin123
```

## Automated Restoration Script

### Quick Restore
```bash
./restore_superadmin.sh
```

This script:
1. ✅ Creates/updates superadmin user via Supabase Auth API
2. ✅ Sets correct password (admin123)
3. ✅ Grants superadmin metadata
4. ✅ Adds user_roles entry
5. ✅ Verifies everything is working

## Database Reset Best Practices

### ❌ AVOID: Full Database Reset (Loses User Data)
```bash
# This deletes ALL data including auth.users
npx supabase db reset
```

### ✅ PREFERRED: Migration-Only Updates
```bash
# Apply only new migrations without wiping data
npx supabase migration up

# Or repair specific migrations
npx supabase migration repair --status applied
```

### ✅ SAFE: Reset with Immediate Restore
```bash
# If you must reset, restore immediately after
npx supabase db reset && ./restore_superadmin.sh
```

## Seed File Protection

The [`supabase/seed.sql`](file:///Users/carlosjulia/yacht-sentinel-ai-complete/supabase/seed.sql) file automatically:
- Checks for superadmin user after migrations
- Adds user_roles entry if user exists
- Logs seed execution

**Note**: Seed file cannot create auth.users entries. Always run `restore_superadmin.sh` after full resets.

## Manual Verification

### Check if Superadmin Exists
```sql
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'is_superadmin' as is_superadmin,
  u.raw_app_meta_data->>'role' as role,
  ur.role as user_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'superadmin@yachtexcel.com';
```

Expected output:
```
id: 339e3acc-a5a0-43ff-ae07-924fc32a292a
email: superadmin@yachtexcel.com
is_superadmin: true
role: global_superadmin
user_role: superadmin
```

### Check User Roles Table
```sql
SELECT * FROM public.user_roles 
WHERE role = 'superadmin';
```

## Systematic Recovery Procedure

### If Superadmin Lost After Database Reset:

**Step 1: Run Restoration Script**
```bash
./restore_superadmin.sh
```

**Step 2: Verify in Browser**
1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Email: superadmin@yachtexcel.com
   - Password: admin123
3. Should redirect to /superadmin automatically

**Step 3: Verify Permissions**
1. Go to SuperAdmin → System Settings
2. Check that all tabs are accessible
3. Verify user info shows "SuperAdmin" badge

## Troubleshooting

### Issue: "User exists but wrong password"
```bash
# Reset password using Auth API
curl -X PUT "http://127.0.0.1:54321/auth/v1/admin/users/USER_ID" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'
```

### Issue: "Access denied" after login
```sql
-- Verify user_roles entry exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'superadmin@yachtexcel.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Issue: "isSuper is false" in console
```sql
-- Update user metadata
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_superadmin}',
    'true'::jsonb
  ),
  raw_app_meta_data = jsonb_set(
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{is_superadmin}',
      'true'::jsonb
    ),
    '{role}',
    '"global_superadmin"'::jsonb
  )
WHERE email = 'superadmin@yachtexcel.com';
```

## Preventing Future Issues

### 1. Before Any Database Operation
```bash
# Backup current auth.users
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -t auth.users -t public.user_roles > backup_users.sql

# Perform database operation
npx supabase db reset

# Restore if needed
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup_users.sql

# Or use restoration script
./restore_superadmin.sh
```

### 2. Add to Migration Workflow
Always include in post-migration steps:
```bash
# Apply migration
npx supabase migration up

# Verify superadmin exists
./restore_superadmin.sh
```

### 3. CI/CD Integration
Add to your CI/CD pipeline:
```yaml
- name: Setup Database
  run: |
    npx supabase db reset
    ./restore_superadmin.sh
```

## Files Reference

- **Restoration Script**: [`restore_superadmin.sh`](file:///Users/carlosjulia/yacht-sentinel-ai-complete/restore_superadmin.sh) - Main restoration tool
- **Seed File**: [`supabase/seed.sql`](file:///Users/carlosjulia/yacht-sentinel-ai-complete/supabase/seed.sql) - Auto-runs after migrations
- **SQL Script**: [`restore_superadmin.sql`](file:///Users/carlosjulia/yacht-sentinel-ai-complete/restore_superadmin.sql) - Manual SQL restoration

## Summary

✅ **Always Available**: Run `./restore_superadmin.sh` anytime to restore access  
✅ **Idempotent**: Safe to run multiple times  
✅ **Fast**: Completes in seconds  
✅ **Verified**: Checks and displays results  
✅ **Systematic**: Handles all necessary steps  

**Remember**: Never run `npx supabase db reset` without immediately following with `./restore_superadmin.sh`
