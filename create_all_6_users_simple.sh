#!/bin/bash

# =====================================================================================
# CREATE ALL 6 USERS SCRIPT - SIMPLIFIED VERSION
# =====================================================================================
# Creates all 6 user types: superadmin, admin, manager, user, viewer, guest
# =====================================================================================

set -e

echo "👥 CREATING ALL 6 USERS FOR YACHT SENTINEL AI"
echo "============================================="

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Function to create a single user
create_user() {
    local role=$1
    local email=$2
    local password=$3
    local is_superadmin=$4
    
    echo ""
    echo "👤 Creating $role user: $email"
    
    # Create user via Supabase Auth API
    USER_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"email_confirm\": true,
        \"user_metadata\": {
          \"role\": \"$role\",
          \"is_superadmin\": $is_superadmin
        },
        \"app_metadata\": {
          \"role\": \"$role\",
          \"is_superadmin\": $is_superadmin
        }
      }")
    
    # Extract user ID from response
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$USER_ID" ]]; then
        echo "   ✅ User created successfully - ID: $USER_ID"
        
        # Add user role to database
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
        echo "   ❌ Failed to create user: $email"
        echo "   Response: $USER_RESPONSE"
        return 1
    fi
}

# Create users one by one
echo ""
echo "🚀 Starting user creation process..."
CREATED_COUNT=0

# 1. Superadmin
if create_user "superadmin" "superadmin@yachtexcel.com" "superadmin123" "true"; then
    ((CREATED_COUNT++))
fi

# 2. Admin
if create_user "admin" "admin@yachtexcel.com" "admin123" "false"; then
    ((CREATED_COUNT++))
fi

# 3. Manager
if create_user "manager" "manager@yachtexcel.com" "manager123" "false"; then
    ((CREATED_COUNT++))
fi

# 4. User
if create_user "user" "user@yachtexcel.com" "user123" "false"; then
    ((CREATED_COUNT++))
fi

# 5. Viewer
if create_user "viewer" "viewer@yachtexcel.com" "viewer123" "false"; then
    ((CREATED_COUNT++))
fi

# 6. Guest
if create_user "guest" "guest@yachtexcel.com" "guest123" "false"; then
    ((CREATED_COUNT++))
fi

echo ""
echo "📊 USER CREATION SUMMARY"
echo "========================"
echo "✅ Created $CREATED_COUNT out of 6 users"

if [ $CREATED_COUNT -eq 0 ]; then
    echo "❌ No users created successfully"
    exit 1
fi

# Verify all users in database
echo ""
echo "🔍 VERIFICATION - Users in auth.users:"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT 
    email,
    raw_user_meta_data->>'role' as user_role,
    raw_app_meta_data->>'is_superadmin' as is_superadmin,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
ORDER BY email;"

echo ""
echo "🔍 VERIFICATION - Users in user_roles:"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT 
    ur.role,
    u.email,
    ur.is_active
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.role;"

echo ""
echo "🎉 USER CREATION COMPLETED!"
echo "=========================="
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
echo "✅ Ready to create unified backup with all $CREATED_COUNT users!"