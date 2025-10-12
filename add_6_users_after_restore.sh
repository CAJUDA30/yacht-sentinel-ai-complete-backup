#!/bin/bash

# =====================================================================================
# ADD 6 USERS AFTER UNIFIED BACKUP RESTORE
# =====================================================================================
# Run this script AFTER restoring the unified backup to add all 6 users
# This uses Supabase signup functionality to create proper authenticated users
# =====================================================================================

set -e

echo "👥 ADDING ALL 6 USERS AFTER UNIFIED BACKUP RESTORE"
echo "=================================================="

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# User definitions
USERS=(
    "superadmin@yachtexcel.com:superadmin123:superadmin"
    "admin@yachtexcel.com:admin123:admin"
    "manager@yachtexcel.com:manager123:manager"
    "user@yachtexcel.com:user123:user"
    "viewer@yachtexcel.com:viewer123:viewer"
    "guest@yachtexcel.com:guest123:guest"
)

# Function to sign up a user
signup_user() {
    local email=$1
    local password=$2
    local role=$3
    
    echo ""
    echo "👤 Signing up $role: $email"
    
    # Sign up user using Supabase auth
    SIGNUP_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
      -H "apikey: $ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"data\": {
          \"role\": \"$role\",
          \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")
        }
      }")
    
    # Check if signup was successful
    if echo "$SIGNUP_RESPONSE" | grep -q '"id"'; then
        USER_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "   ✅ User signed up successfully - ID: $USER_ID"
        
        # Add role to user_roles table
        psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" << EOF > /dev/null 2>&1
INSERT INTO public.user_roles (user_id, role, created_by, is_active)
VALUES ('$USER_ID', '$role', '$USER_ID', true)
ON CONFLICT (user_id, role) DO UPDATE SET 
    is_active = true,
    updated_at = now();
EOF
        echo "   ✅ Role assigned in database"
        return 0
    else
        echo "   ❌ Failed to sign up user: $email"
        echo "   Response: $SIGNUP_RESPONSE"
        return 1
    fi
}

# Check if Supabase is running
echo ""
echo "🔍 Checking if Supabase is running..."
if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $ANON_KEY" > /dev/null; then
    echo "✅ Supabase is running"
else
    echo "❌ Supabase is not running. Please start it first with:"
    echo "   npx supabase start"
    exit 1
fi

# Sign up all users
echo ""
echo "🚀 Starting user signup process..."
CREATED_COUNT=0

for user_data in "${USERS[@]}"; do
    IFS=':' read -r email password role <<< "$user_data"
    if signup_user "$email" "$password" "$role"; then
        ((CREATED_COUNT++))
    fi
done

echo ""
echo "📊 USER SIGNUP SUMMARY"
echo "======================"
echo "✅ Created $CREATED_COUNT out of 6 users"

# Verify all users in database
echo ""
echo "🔍 VERIFICATION - Users in auth.users:"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT 
    email,
    raw_user_meta_data->>'role' as user_role,
    raw_user_meta_data->>'is_superadmin' as is_superadmin,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at::date as created_date
FROM auth.users 
ORDER BY email;"

echo ""
echo "🔍 VERIFICATION - Users in user_roles:"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT 
    ur.role,
    u.email,
    ur.is_active,
    ur.created_at::date as created_date
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.role;"

echo ""
if [ $CREATED_COUNT -eq 6 ]; then
    echo "🎉 ALL 6 USERS CREATED SUCCESSFULLY!"
    echo "===================================="
else
    echo "⚠️  Created $CREATED_COUNT users out of 6"
    echo "===================================="
fi

echo ""
echo "🔑 LOGIN CREDENTIALS:"
echo "   Superadmin: superadmin@yachtexcel.com / superadmin123"
echo "   Admin:      admin@yachtexcel.com / admin123"
echo "   Manager:    manager@yachtexcel.com / manager123"
echo "   User:       user@yachtexcel.com / user123"
echo "   Viewer:     viewer@yachtexcel.com / viewer123"
echo "   Guest:      guest@yachtexcel.com / guest123"
echo ""
echo "🌐 Login URL: http://localhost:5174/login"
echo ""
echo "✅ Ready to use with all $CREATED_COUNT users!"