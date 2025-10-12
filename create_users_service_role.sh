#!/bin/bash

# =====================================================================================
# CREATE ALL 6 USERS USING SERVICE ROLE
# =====================================================================================
# This script creates all 6 users using the service role to bypass RLS policies
# =====================================================================================

set -e

echo "👥 CREATING ALL 6 USERS USING SERVICE ROLE"
echo "==========================================="

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# User definitions
USERS=(
    "superadmin@yachtexcel.com:superadmin123:superadmin"
    "admin@yachtexcel.com:admin123:admin"
    "manager@yachtexcel.com:manager123:manager"
    "user@yachtexcel.com:user123:user"
    "viewer@yachtexcel.com:viewer123:viewer"
    "guest@yachtexcel.com:guest123:guest"
)

# Function to create a user using service role
create_user_service_role() {
    local email=$1
    local password=$2
    local role=$3
    
    echo ""
    echo "👤 Creating $role: $email"
    
    # Create user using admin API with service role
    RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"email_confirm\": true,
        \"user_metadata\": {
          \"role\": \"$role\",
          \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")
        }
      }")
    
    # Check if creation was successful
    if echo "$RESPONSE" | grep -q '"id"'; then
        USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "   ✅ User created successfully - ID: $USER_ID"
        
        # Add role to user_roles table using service role
        ROLE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/user_roles" \
          -H "apikey: $SERVICE_ROLE_KEY" \
          -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
          -H "Content-Type: application/json" \
          -H "Prefer: return=representation" \
          -d "{
            \"user_id\": \"$USER_ID\",
            \"role\": \"$role\",
            \"granted_by\": \"$USER_ID\",
            \"is_active\": true
          }")
        
        if echo "$ROLE_RESPONSE" | grep -q '"id"'; then
            echo "   ✅ Role assigned successfully"
        else
            echo "   ⚠️  Role assignment may have failed: $ROLE_RESPONSE"
        fi
        
        return 0
    else
        echo "   ❌ Failed to create user: $email"
        echo "   Response: $RESPONSE"
        return 1
    fi
}

# Check if Supabase is running
echo ""
echo "🔍 Checking if Supabase is running..."
if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SERVICE_ROLE_KEY" > /dev/null; then
    echo "✅ Supabase is running"
else
    echo "❌ Supabase is not running. Please start it first with:"
    echo "   npx supabase start"
    exit 1
fi

# Create all users
echo ""
echo "🚀 Starting user creation process..."
CREATED_COUNT=0

for user_data in "${USERS[@]}"; do
    IFS=':' read -r email password role <<< "$user_data"
    if create_user_service_role "$email" "$password" "$role"; then
        ((CREATED_COUNT++))
    fi
done

echo ""
echo "📊 USER CREATION SUMMARY"
echo "========================"
echo "✅ Created $CREATED_COUNT out of 6 users"

# Verify all users in database
echo ""
echo "🔍 VERIFICATION - Users in auth.users:"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT 
    email,
    raw_user_meta_data->>'role' as user_role,
    raw_user_meta_data->>'is_superadmin' as is_superadmin,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at::date as created_date
FROM auth.users 
WHERE email LIKE '%yachtexcel.com'
ORDER BY email;"

echo ""
echo "🔍 VERIFICATION - Users in user_roles:"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT 
    ur.role,
    u.email,
    ur.is_active,
    ur.created_at::date as created_date
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email LIKE '%yachtexcel.com'
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