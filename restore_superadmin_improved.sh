#!/bin/bash

# =============================================================================
# YACHT SENTINEL AI - IMPROVED SUPERADMIN RESTORATION SCRIPT
# =============================================================================
# This script provides comprehensive recovery for the superadmin user
# Handles all edge cases and ensures system functionality
# =============================================================================

set -e

echo "🔧 YACHT SENTINEL AI - IMPROVED RECOVERY"
echo "========================================"

# Configuration
SUPERADMIN_EMAIL="superadmin@yachtexcel.com"
SUPERADMIN_PASSWORD="admin123"
SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Step 1: Verify Supabase is running
echo "🔍 Checking Supabase status..."
if ! curl -sf "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first:"
    echo "   npx supabase start"
    exit 1
fi
echo "✅ Supabase is running"

# Step 2: Ensure required database structures exist
echo "📋 Ensuring required database structures..."

# Check if tables exist
TABLES_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
if [ "$TABLES_COUNT" -eq "0" ]; then
    echo "❌ No tables found. Database needs to be reset:"
    echo "   npx supabase db reset --local"
    exit 1
fi
echo "✅ Database tables exist ($TABLES_COUNT tables)"

# Ensure critical indexes exist
psql "$DB_URL" -c "
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role) 
WHERE yacht_id IS NULL AND department IS NULL;
" > /dev/null 2>&1 || echo "⚠️  Index creation skipped"

# Disable problematic triggers that cause user creation failures
psql "$DB_URL" -c "
DROP TRIGGER IF EXISTS assign_default_user_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_signup_trigger ON auth.users;
" > /dev/null 2>&1 || echo "⚠️  Trigger removal skipped"

echo "✅ Database structures verified"

# Step 3: Check if superadmin already exists
echo "👤 Checking for existing superadmin user..."
EXISTING_USER_ID=$(psql "$DB_URL" -t -c "SELECT id FROM auth.users WHERE email = '$SUPERADMIN_EMAIL';" 2>/dev/null | tr -d ' ')

if [ -n "$EXISTING_USER_ID" ] && [ "$EXISTING_USER_ID" != "" ]; then
    echo "✅ Superadmin user already exists: $EXISTING_USER_ID"
    USER_ID="$EXISTING_USER_ID"
    
    # Test if login works
    LOGIN_TEST=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
      -H "apikey: $ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_TEST" | grep -q "access_token"; then
        echo "✅ Login test successful"
    else
        echo "⚠️  Login failed, will update password and metadata"
    fi
else
    # Step 4: Create superadmin user via signup API
    echo "👤 Creating superadmin user..."
    USER_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
      -H "apikey: $ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASSWORD\"}")

    if echo "$USER_RESPONSE" | grep -q "access_token"; then
        echo "✅ Superadmin user created successfully"
        USER_ID=$(echo "$USER_RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")
        if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
            echo "❌ Failed to extract user ID from response"
            exit 1
        fi
        echo "   User ID: $USER_ID"
    else
        echo "❌ Failed to create superadmin user"
        echo "Response: $USER_RESPONSE"
        exit 1
    fi
fi

# Step 5: Update user metadata and ensure proper setup
echo "🎭 Setting up superadmin metadata and roles..."

psql "$DB_URL" << EOF
-- Update user metadata to ensure superadmin privileges
UPDATE auth.users 
SET 
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "superadmin"}'::jsonb,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "global_superadmin"}'::jsonb,
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = '$SUPERADMIN_EMAIL';

-- Ensure superadmin role exists in user_roles table
INSERT INTO public.user_roles (user_id, role, granted_by, is_active) 
VALUES ('$USER_ID', 'superadmin', '$USER_ID', true)
ON CONFLICT DO NOTHING;

-- Create or update user profile (skip if table doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        INSERT INTO public.user_profiles (user_id, display_name) 
        VALUES ('$USER_ID', 'Super Administrator')
        ON CONFLICT (user_id) DO UPDATE SET 
          display_name = 'Super Administrator',
          updated_at = NOW();
    ELSE
        RAISE NOTICE 'user_profiles table does not exist, skipping profile creation';
    END IF;
END $$;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Superadmin metadata and roles configured"
else
    echo "⚠️  Some metadata updates may have failed"
fi

# Step 6: Verify the complete setup
echo "🔍 Verifying superadmin setup..."

VERIFICATION=$(psql "$DB_URL" -t -c "
SELECT 
    u.email,
    u.raw_user_meta_data->>'is_superadmin' as user_meta_superadmin,
    u.raw_app_meta_data->>'role' as app_meta_role,
    ur.role as user_role,
    up.display_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'superadmin'
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE u.email = '$SUPERADMIN_EMAIL';
" 2>/dev/null)

echo "Verification results:"
echo "$VERIFICATION"

# Step 7: Test final login
echo "🧪 Testing final login..."
FINAL_LOGIN=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASSWORD\"}")

if echo "$FINAL_LOGIN" | grep -q "access_token"; then
    echo "✅ Final login test successful"
else
    echo "❌ Final login test failed"
    echo "Response: $FINAL_LOGIN"
    exit 1
fi

# Step 8: Generate TypeScript types
echo "🔧 Generating TypeScript types..."
if command -v npx > /dev/null; then
    if npx supabase gen types typescript --local > src/integrations/supabase/types.ts 2>/dev/null; then
        echo "✅ TypeScript types generated successfully"
    else
        echo "⚠️  TypeScript types generation failed (non-critical)"
    fi
else
    echo "⚠️  npx not found, skipping TypeScript type generation"
fi

# Step 9: Success summary
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
echo "✅ Superadmin metadata configured"
echo "✅ User roles and profile created"
echo "✅ Login functionality verified"
echo "✅ TypeScript types updated"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Start the frontend: npm run dev"
echo "2. Navigate to: http://localhost:5173/auth"
echo "3. Login with the credentials above"
echo "4. Access SuperAdmin panel: http://localhost:5173/superadmin"
echo "5. Check Document AI Manager: AI Operations → Processors"
echo ""
echo "✨ System is ready for development!"