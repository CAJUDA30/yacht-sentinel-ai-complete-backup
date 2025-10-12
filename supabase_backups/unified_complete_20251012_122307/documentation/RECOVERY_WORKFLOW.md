# 🔧 YACHT SENTINEL AI - COMPLETE RECOVERY WORKFLOW

## 🚨 **IMMEDIATE RECOVERY STEPS**

### **Option A: Full System Recovery (Recommended)**
```bash
# 1. Stop all services
npx supabase stop

# 2. Fresh restart with migrations
npx supabase start

# 3. Reset database with new comprehensive seed
npx supabase db reset --local

# 4. Create superadmin user
curl -s -X POST "http://127.0.0.1:54321/auth/v1/signup" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@yachtexcel.com", "password": "admin123"}'

# 5. Generate types and start frontend
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
npm run dev
```

### **Option B: Quick Recovery (If system is partially working)**
```bash
# 1. Just run the improved restoration script
./restore_superadmin_improved.sh

# 2. Start frontend
npm run dev
```

---

## 📋 **SYSTEMATIC TROUBLESHOOTING GUIDE**

### **Problem 1: Database Reset Breaks Everything**
**Symptoms:** No tables, migrations fail, user doesn't exist

**Solution:**
```bash
# Check migration order
npx supabase migration list --local

# If 2024* migrations exist, rename them:
cd supabase/migrations
mv 20241211* to 2025*

# Reset with correct order
npx supabase db reset --local
```

### **Problem 2: User Creation Fails**
**Symptoms:** "Database error saving new user", trigger failures

**Root Cause:** Missing unique indexes, problematic triggers

**Solution:**
```bash
# Disable problematic triggers
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
DROP TRIGGER IF EXISTS assign_default_user_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_signup_trigger ON auth.users;
"

# Add required indexes
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role) 
WHERE yacht_id IS NULL AND department IS NULL;
"

# Create user via API
curl -X POST "http://127.0.0.1:54321/auth/v1/signup" ...
```

### **Problem 3: TypeScript Errors**
**Symptoms:** Import errors, type mismatches

**Solution:**
```bash
# Regenerate types after database changes
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Check imports in components
# Fix: import { supabase } from '@/integrations/supabase/client';
```

### **Problem 4: RLS Policy Errors**
**Symptoms:** 403 Forbidden, policy recursion

**Solution:**
```bash
# Check superadmin is properly configured
psql -c "SELECT * FROM auth.users WHERE email = 'superadmin@yachtexcel.com';"
psql -c "SELECT * FROM public.user_roles WHERE role = 'superadmin';"
```

---

## 🔄 **DEVELOPMENT WORKFLOW GUIDELINES**

### **When to Use Database Reset**
✅ **SAFE TO RESET:**
- Testing new migrations
- Major schema changes
- Development environment setup
- Fresh feature development

❌ **AVOID RESET WHEN:**
- Production data exists
- Working on frontend-only changes
- Small bug fixes
- Users have been created manually

### **When to Use Migrations Only**
```bash
# For incremental changes
npx supabase migration up --local

# For specific migration fixes
npx supabase migration repair --status applied
```

### **When to Use Seed File**
- After every reset
- When setting up development environment
- When you need consistent test data
- To restore essential system configurations

---

## 🧪 **TESTING PROTOCOL**

### **Full Cycle Test (Run this after major changes)**
```bash
# 1. Clean slate
npx supabase stop
rm -rf .supabase (optional - for completely fresh start)

# 2. Fresh start
npx supabase start

# 3. Verify migrations
npx supabase migration list --local

# 4. Reset with seed
npx supabase db reset --local

# 5. Create superadmin
curl -X POST "http://127.0.0.1:54321/auth/v1/signup" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@yachtexcel.com", "password": "admin123"}'

# 6. Verify login
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@yachtexcel.com", "password": "admin123"}'

# 7. Generate types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# 8. Start frontend
npm run dev

# 9. Test access
# Navigate to http://localhost:5173/auth
# Login with superadmin@yachtexcel.com / admin123
# Go to /superadmin
# Check AI Operations -> Processors tab
```

### **Expected Results:**
- ✅ Database has all tables
- ✅ Superadmin user exists and can login
- ✅ SuperAdmin panel accessible
- ✅ Document AI Manager visible
- ✅ No TypeScript errors
- ✅ No console errors

---

## 📚 **RECOVERY SCRIPTS**

### **Improved Superadmin Restoration Script**
File: `restore_superadmin_improved.sh`
```bash
#!/bin/bash
set -e

echo "🔧 YACHT SENTINEL AI - IMPROVED RECOVERY"
echo "========================================"

# Configuration
SUPERADMIN_EMAIL="superadmin@yachtexcel.com"
SUPERADMIN_PASSWORD="admin123"
SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Step 1: Ensure indexes exist
echo "📋 Ensuring required indexes exist..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role) 
WHERE yacht_id IS NULL AND department IS NULL;
" || echo "Index already exists"

# Step 2: Disable problematic triggers
echo "🔧 Disabling problematic triggers..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
DROP TRIGGER IF EXISTS assign_default_user_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_signup_trigger ON auth.users;
" || echo "Triggers already removed"

# Step 3: Create user via signup API
echo "👤 Creating superadmin user..."
USER_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASSWORD\"}")

if echo "$USER_RESPONSE" | grep -q "access_token"; then
    echo "✅ Superadmin user created successfully"
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.user.id')
    echo "   User ID: $USER_ID"
else
    echo "⚠️  User might already exist, checking..."
    # Try login instead
    LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
      -H "apikey: $ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        echo "✅ Superadmin user already exists and login works"
        USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
        echo "   User ID: $USER_ID"
    else
        echo "❌ Failed to create or login superadmin user"
        exit 1
    fi
fi

# Step 4: Update user metadata and roles
echo "🎭 Setting up superadmin metadata and roles..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" << EOF
-- Update user metadata
UPDATE auth.users 
SET 
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "superadmin"}'::jsonb,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "global_superadmin"}'::jsonb,
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = '$SUPERADMIN_EMAIL';

-- Add superadmin role
INSERT INTO public.user_roles (user_id, role, granted_by, is_active) 
VALUES ('$USER_ID', 'superadmin', '$USER_ID', true)
ON CONFLICT DO NOTHING;

-- Create user profile
INSERT INTO public.user_profiles (user_id, display_name) 
VALUES ('$USER_ID', 'Super Administrator')
ON CONFLICT (user_id) DO UPDATE SET 
  display_name = 'Super Administrator',
  updated_at = NOW();
EOF

# Step 5: Generate types
echo "🔧 Generating TypeScript types..."
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

echo ""
echo "🎉 RECOVERY COMPLETED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "🔑 LOGIN CREDENTIALS:"
echo "   Email:    $SUPERADMIN_EMAIL"
echo "   Password: $SUPERADMIN_PASSWORD"
echo "   URL:      http://localhost:5173/auth"
echo ""
echo "✅ User ID: $USER_ID"
echo "✅ TypeScript types generated"
echo "✅ Ready for development!"
echo ""
```

---

## 🚀 **QUICK REFERENCE COMMANDS**

```bash
# Emergency Recovery (one-liner)
npx supabase db reset --local && ./restore_superadmin_improved.sh && npm run dev

# Check System Status
npx supabase status
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\dt" | wc -l
curl -s "http://127.0.0.1:54321/auth/v1/health"

# Verify Superadmin
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT u.email, ur.role, up.display_name 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON ur.user_id = u.id 
LEFT JOIN public.user_profiles up ON up.user_id = u.id 
WHERE u.email = 'superadmin@yachtexcel.com';"

# Test Login
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@yachtexcel.com", "password": "admin123"}' | jq .user.email
```

---

## 📝 **FINAL CHECKLIST**

Before considering the system "recovered":

- [ ] Database has all expected tables (check with `\dt`)
- [ ] Superadmin user exists in auth.users
- [ ] Superadmin has user_roles entry with role='superadmin'
- [ ] Superadmin has user_profiles entry
- [ ] Login API works (returns access_token)
- [ ] TypeScript types are current
- [ ] Frontend starts without errors
- [ ] Can access /superadmin page
- [ ] Can access AI Operations -> Processors tab
- [ ] Document AI Manager loads without errors

**System is ready when ALL checkboxes are ✅**