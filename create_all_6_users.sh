#!/bin/bash

# =====================================================================================
# CREATE ALL 6 USERS SCRIPT
# =====================================================================================
# Creates all 6 user types: superadmin, admin, manager, user, viewer, guest
# Each with appropriate permissions and roles
# =====================================================================================

set -e

echo "👥 CREATING ALL 6 USERS FOR YACHT SENTINEL AI"
echo "============================================="

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# User definitions
USERS="superadmin:superadmin@yachtexcel.com:superadmin123:superadmin:Global Administrator with full system access
admin:admin@yachtexcel.com:admin123:admin:System Administrator with elevated privileges
manager:manager@yachtexcel.com:manager123:manager:Department Manager with team oversight
user:user@yachtexcel.com:user123:user:Standard User with basic access
viewer:viewer@yachtexcel.com:viewer123:viewer:Read-only User with view permissions
guest:guest@yachtexcel.com:guest123:guest:Guest User with limited access"

# Function to create a single user
create_user() {
    local role=$1
    local email=$2
    local password=$3
    local role_name=$4
    local description=$5
    
    echo ""
    echo "👤 Creating $role user: $email"
    echo "   Role: $role_name"
    echo "   Description: $description"
    
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
          \"display_name\": \"$role_name\",
          \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")
        },
        \"app_metadata\": {
          \"role\": \"$role\",
          \"permissions\": \"$(get_permissions $role)\",
          \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")
        }
      }")
    
    # Extract user ID from response
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$USER_ID" ]]; then
        echo "   ✅ User created successfully - ID: $USER_ID"
        
        # Add user role to database
        psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" << EOF > /dev/null 2>&1
INSERT INTO public.user_roles (user_id, role, created_by, is_active, permissions)
VALUES ('$USER_ID', '$role', '$USER_ID', true, '$(get_permissions $role)')
ON CONFLICT (user_id, role) DO UPDATE SET 
    is_active = true,
    permissions = '$(get_permissions $role)',
    updated_at = now();
EOF
        echo "   ✅ Role assigned in database"
        
        # Store user ID for return
        echo "$USER_ID:$role:$email"
    else
        echo "   ❌ Failed to create user: $email"
        echo "   Response: $USER_RESPONSE"
    fi
}

# Function to get permissions based on role
get_permissions() {
    local role=$1
    case $role in
        "superadmin")
            echo '["*"]'
            ;;
        "admin")
            echo '["read", "write", "delete", "manage_users", "manage_settings"]'
            ;;
        "manager")
            echo '["read", "write", "manage_team", "view_reports"]'
            ;;
        "user")
            echo '["read", "write", "view_own"]'
            ;;
        "viewer")
            echo '["read", "view_own"]'
            ;;
        "guest")
            echo '["read_limited"]'
            ;;
        *)
            echo '["read"]'
            ;;
    esac
}

# Create all users
echo ""
echo "🚀 Starting user creation process..."
USER_RESULTS=()

echo "$USERS" | while IFS=':' read -r role email password role_name description; do
    result=$(create_user "$role" "$email" "$password" "$role_name" "$description")
    if [[ -n "$result" ]]; then
        echo "$result" >> /tmp/user_results.txt
    fi
done

# Read results from temp file
if [ -f "/tmp/user_results.txt" ]; then
    while IFS= read -r line; do
        USER_RESULTS+=("$line")
    done < /tmp/user_results.txt
    rm -f /tmp/user_results.txt
fi

echo ""
echo "📊 USER CREATION SUMMARY"
echo "========================"

if [ ${#USER_RESULTS[@]} -eq 0 ]; then
    echo "❌ No users created successfully"
    exit 1
fi

echo "✅ Created ${#USER_RESULTS[@]} users:"
echo ""

for result in "${USER_RESULTS[@]}"; do
    IFS=':' read -r user_id role email <<< "$result"
    echo "👤 $role: $email"
    echo "   ID: $user_id"
    echo "   Permissions: $(get_permissions $role)"
    echo ""
done

# Verify all users in database
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
    ur.is_active,
    ur.permissions
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.role;"

echo ""
echo "🎉 ALL USERS CREATED SUCCESSFULLY!"
echo "=================================="
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
echo "✅ Ready to create unified backup with all 6 users!"