#!/bin/bash

# =====================================================================================
# CREATE ALL 6 USERS - DIRECT DATABASE APPROACH
# =====================================================================================

set -e

echo "👥 CREATING ALL 6 USERS VIA DIRECT DATABASE INSERT"
echo "=================================================="

# Create users directly in database
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" << 'EOF'

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert users directly into auth.users table
DO $$
DECLARE
    superadmin_id UUID := gen_random_uuid();
    admin_id UUID := gen_random_uuid();
    manager_id UUID := gen_random_uuid();
    user_id UUID := gen_random_uuid();
    viewer_id UUID := gen_random_uuid();
    guest_id UUID := gen_random_uuid();
    current_time TIMESTAMPTZ := now();
BEGIN
    -- Clear existing users first
    DELETE FROM public.user_roles;
    DELETE FROM auth.users;
    
    -- Insert superadmin
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        superadmin_id,
        'authenticated',
        'authenticated',
        'superadmin@yachtexcel.com',
        crypt('superadmin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "superadmin", "is_superadmin": true}',
        '{"role": "superadmin", "is_superadmin": true}',
        true
    );
    
    -- Insert admin
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_id,
        'authenticated',
        'authenticated',
        'admin@yachtexcel.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "admin"}',
        '{"role": "admin"}'
    );
    
    -- Insert manager
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        manager_id,
        'authenticated',
        'authenticated',
        'manager@yachtexcel.com',
        crypt('manager123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "manager"}',
        '{"role": "manager"}'
    );
    
    -- Insert user
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        'user@yachtexcel.com',
        crypt('user123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "user"}',
        '{"role": "user"}'
    );
    
    -- Insert viewer
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        viewer_id,
        'authenticated',
        'authenticated',
        'viewer@yachtexcel.com',
        crypt('viewer123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "viewer"}',
        '{"role": "viewer"}'
    );
    
    -- Insert guest
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_user_meta_data, raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        guest_id,
        'authenticated',
        'authenticated',
        'guest@yachtexcel.com',
        crypt('guest123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"role": "guest"}',
        '{"role": "guest"}'
    );
    
    -- Create user_roles entries
    INSERT INTO public.user_roles (user_id, role, created_by, is_active) VALUES
        (superadmin_id, 'superadmin', superadmin_id, true),
        (admin_id, 'admin', superadmin_id, true),
        (manager_id, 'manager', superadmin_id, true),
        (user_id, 'user', superadmin_id, true),
        (viewer_id, 'viewer', superadmin_id, true),
        (guest_id, 'guest', superadmin_id, true);
    
    -- Output the created users
    RAISE NOTICE 'Created users:';
    RAISE NOTICE 'Superadmin ID: %', superadmin_id;
    RAISE NOTICE 'Admin ID: %', admin_id;
    RAISE NOTICE 'Manager ID: %', manager_id;
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'Viewer ID: %', viewer_id;
    RAISE NOTICE 'Guest ID: %', guest_id;
END $$;

EOF

echo ""
echo "🔍 VERIFICATION - Users in auth.users:"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT 
    email,
    raw_user_meta_data->>'role' as user_role,
    raw_app_meta_data->>'is_superadmin' as is_superadmin,
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
echo "🎉 ALL 6 USERS CREATED SUCCESSFULLY!"
echo "===================================="
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