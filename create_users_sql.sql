-- =====================================================================================
-- CREATE ALL 6 USERS VIA DIRECT SQL
-- =====================================================================================
-- This script creates all 6 users directly in the auth.users table
-- with proper password hashing and role assignments
-- =====================================================================================

-- Function to generate UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert users directly into auth.users table
-- Insert users directly into auth.users table (without ON CONFLICT since no unique constraint)
DO $$
DECLARE
    superadmin_id UUID := uuid_generate_v4();
    admin_id UUID := uuid_generate_v4();
    manager_id UUID := uuid_generate_v4();
    user_id UUID := uuid_generate_v4();
    viewer_id UUID := uuid_generate_v4();
    guest_id UUID := uuid_generate_v4();
BEGIN
    -- Only insert if users don't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', superadmin_id, 'authenticated', 'authenticated', 
            'superadmin@yachtexcel.com', crypt('superadmin123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "superadmin", "is_superadmin": true}', 
            true, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (superadmin_id, 'superadmin', superadmin_id, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 
            'admin@yachtexcel.com', crypt('admin123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "admin", "is_superadmin": false}', 
            false, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (admin_id, 'admin', superadmin_id, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', manager_id, 'authenticated', 'authenticated', 
            'manager@yachtexcel.com', crypt('manager123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "manager", "is_superadmin": false}', 
            false, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (manager_id, 'manager', superadmin_id, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', 
            'user@yachtexcel.com', crypt('user123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "user", "is_superadmin": false}', 
            false, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (user_id, 'user', superadmin_id, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', viewer_id, 'authenticated', 'authenticated', 
            'viewer@yachtexcel.com', crypt('viewer123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "viewer", "is_superadmin": false}', 
            false, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (viewer_id, 'viewer', superadmin_id, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'guest@yachtexcel.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', guest_id, 'authenticated', 'authenticated', 
            'guest@yachtexcel.com', crypt('guest123', gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}', 
            '{"role": "guest", "is_superadmin": false}', 
            false, now(), now()
        );
        
        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
        VALUES (guest_id, 'guest', superadmin_id, true);
    END IF;
END $$;

-- User roles are created in the DO block above

-- Verify the creation
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as user_role,
    u.raw_user_meta_data->>'is_superadmin' as is_superadmin,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.created_at::date as created_date
FROM auth.users u 
WHERE u.email LIKE '%yachtexcel.com'
ORDER BY u.email;

SELECT 
    ur.role,
    u.email,
    ur.is_active,
    ur.created_at::date as created_date
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email LIKE '%yachtexcel.com'  
ORDER BY ur.role;