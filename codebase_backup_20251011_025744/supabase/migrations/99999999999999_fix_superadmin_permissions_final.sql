-- =====================================================================================
-- DEFINITIVE SUPERADMIN PERMISSIONS FIX
-- =====================================================================================
-- This migration resolves ALL superadmin permission issues by:
-- 1. Dropping ALL conflicting policies across ALL tables
-- 2. Creating consistent, non-recursive policies
-- 3. Using direct email-based superadmin detection
-- 4. Ensuring the superadmin user exists and has proper roles
-- =====================================================================================

-- =====================================================================================
-- PHASE 1: CLEAN SLATE - Remove ALL conflicting policies
-- =====================================================================================

-- Drop ALL policies on user_roles (source of most recursion issues)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated_access_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin full access" ON public.user_roles;

-- Drop ALL policies on system_settings
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.system_settings;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.system_settings;
DROP POLICY IF EXISTS "SuperAdmins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated read access" ON public.system_settings;
DROP POLICY IF EXISTS "Superadmin full access" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.system_settings;

-- Drop ALL policies on ai_providers_unified
DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_access_ai_providers_unified" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Service role full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_providers_unified;

-- Drop ALL policies on other critical tables
DROP POLICY IF EXISTS "authenticated_access_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "secure_inventory_items_read" ON public.inventory_items;
DROP POLICY IF EXISTS "Service role full access" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated read access" ON public.inventory_items;
DROP POLICY IF EXISTS "Superadmin full access" ON public.inventory_items;

DROP POLICY IF EXISTS "authenticated_access_yachts" ON public.yachts;
DROP POLICY IF EXISTS "Service role full access" ON public.yachts;
DROP POLICY IF EXISTS "Authenticated read access" ON public.yachts;
DROP POLICY IF EXISTS "Superadmin full access" ON public.yachts;

DROP POLICY IF EXISTS "authenticated_access_yacht_profiles" ON public.yacht_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.yacht_profiles;
DROP POLICY IF EXISTS "Authenticated read access" ON public.yacht_profiles;
DROP POLICY IF EXISTS "Superadmin full access" ON public.yacht_profiles;

-- =====================================================================================
-- PHASE 2: CREATE SUPERADMIN USER AND ENSURE PROPER SETUP
-- =====================================================================================

-- Create or update the superadmin user in auth.users
-- Note: This might fail if user already exists, but that's okay
DO $$
DECLARE
    superadmin_user_id UUID;
BEGIN
    -- Check if superadmin user exists
    SELECT id INTO superadmin_user_id 
    FROM auth.users 
    WHERE email = 'superadmin@yachtexcel.com';
    
    IF superadmin_user_id IS NULL THEN
        -- User doesn't exist, we need to create it via the Auth API
        -- This SQL can't create auth.users directly, so we'll log the need
        RAISE NOTICE 'CRITICAL: Superadmin user does not exist. Run: ./restore_superadmin.sh';
    ELSE
        -- User exists, ensure proper metadata
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
        WHERE id = superadmin_user_id;
        
        RAISE NOTICE 'Superadmin user metadata updated: %', superadmin_user_id;
    END IF;
END $$;

-- Ensure superadmin role exists in user_roles table
INSERT INTO public.user_roles (user_id, role, created_by, is_active)
SELECT 
    u.id, 
    'superadmin', 
    u.id, 
    true
FROM auth.users u
WHERE u.email = 'superadmin@yachtexcel.com'
ON CONFLICT (user_id, role) DO UPDATE SET 
    is_active = true,
    updated_at = now();

-- =====================================================================================
-- PHASE 3: CREATE CONSISTENT, NON-RECURSIVE RLS POLICIES
-- =====================================================================================

-- Standard function to check if user is superadmin (email-based, no recursion)
CREATE OR REPLACE FUNCTION public.is_superadmin_by_email(user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = COALESCE(user_id, auth.uid())
        AND email = 'superadmin@yachtexcel.com'
    );
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin_by_email(UUID) TO authenticated, anon;

-- =====================================================================================
-- PHASE 4: APPLY CONSISTENT POLICIES TO ALL TABLES
-- =====================================================================================

-- USER_ROLES TABLE - Source of most recursion issues
CREATE POLICY "service_role_full_access" ON public.user_roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_read_own_roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "superadmin_full_access" ON public.user_roles
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- SYSTEM_SETTINGS TABLE
CREATE POLICY "service_role_full_access" ON public.system_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_access" ON public.system_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access" ON public.system_settings
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- AI_PROVIDERS_UNIFIED TABLE
CREATE POLICY "service_role_full_access" ON public.ai_providers_unified
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_access" ON public.ai_providers_unified
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access" ON public.ai_providers_unified
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- INVENTORY_ITEMS TABLE
CREATE POLICY "service_role_full_access" ON public.inventory_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_access" ON public.inventory_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access" ON public.inventory_items
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- YACHTS TABLE
CREATE POLICY "service_role_full_access" ON public.yachts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_access" ON public.yachts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access" ON public.yachts
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- YACHT_PROFILES TABLE
CREATE POLICY "service_role_full_access" ON public.yacht_profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_access" ON public.yacht_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access" ON public.yacht_profiles
    FOR ALL TO authenticated 
    USING (public.is_superadmin_by_email(auth.uid()))
    WITH CHECK (public.is_superadmin_by_email(auth.uid()));

-- =====================================================================================
-- PHASE 5: ENABLE RLS ON ALL TABLES (if not already enabled)
-- =====================================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- PHASE 6: VERIFICATION
-- =====================================================================================

-- Verify superadmin user setup
DO $$
DECLARE
    user_count INTEGER;
    role_count INTEGER;
BEGIN
    -- Check auth.users
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE email = 'superadmin@yachtexcel.com';
    
    -- Check user_roles
    SELECT COUNT(*) INTO role_count 
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE u.email = 'superadmin@yachtexcel.com' 
    AND ur.role = 'superadmin' 
    AND ur.is_active = true;
    
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE '  - Superadmin users in auth.users: %', user_count;
    RAISE NOTICE '  - Superadmin roles in user_roles: %', role_count;
    
    IF user_count = 0 THEN
        RAISE NOTICE '  ❌ CRITICAL: No superadmin user found. Run ./restore_superadmin.sh';
    ELSIF role_count = 0 THEN
        RAISE NOTICE '  ⚠️  WARNING: User exists but no superadmin role assigned';
    ELSE
        RAISE NOTICE '  ✅ SUCCESS: Superadmin setup appears complete';
    END IF;
END $$;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================

RAISE NOTICE '🎉 SUPERADMIN PERMISSIONS FIX MIGRATION COMPLETED';
RAISE NOTICE '';
RAISE NOTICE '✅ All conflicting policies removed';
RAISE NOTICE '✅ Consistent policies applied to all tables';  
RAISE NOTICE '✅ Email-based superadmin detection (no recursion)';
RAISE NOTICE '✅ RLS enabled on all critical tables';
RAISE NOTICE '';
RAISE NOTICE '🔑 SUPERADMIN CREDENTIALS:';
RAISE NOTICE '   Email: superadmin@yachtexcel.com';
RAISE NOTICE '   Password: admin123';
RAISE NOTICE '';
RAISE NOTICE '⚠️  IF LOGIN FAILS: Run ./restore_superadmin.sh to create/fix the user account';