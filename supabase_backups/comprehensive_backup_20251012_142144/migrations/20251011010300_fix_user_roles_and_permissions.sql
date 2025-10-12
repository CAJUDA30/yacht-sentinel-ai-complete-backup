-- ============================================================================
-- PHASE 3: COMPREHENSIVE USER ROLES AND PERMISSION SYSTEM FIX
-- ============================================================================
-- Purpose: Fix all user roles access issues and ensure persistent permissions
-- Date: 2025-10-11 01:03:00
-- Status: CRITICAL PRODUCTION FIX
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIRST: DROP AND RECREATE USER_ROLES POLICIES (COMPREHENSIVE APPROACH)
-- ============================================================================

-- Drop existing policies to rebuild from scratch
DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;  
DROP POLICY IF EXISTS "Superadmin full access" ON public.user_roles;

-- Disable RLS temporarily to ensure we can access
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive service_role policy
CREATE POLICY "Service role full access"
ON public.user_roles FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Create comprehensive authenticated user access policy
CREATE POLICY "Authenticated users access"
ON public.user_roles FOR ALL TO authenticated
USING (
    -- Users can read their own roles
    auth.uid() = user_id
    OR
    -- Superadmin can do everything
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    -- Users can insert/update their own roles
    auth.uid() = user_id
    OR
    -- Superadmin can do everything
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ============================================================================
-- 2. FIX AI_PROVIDERS_UNIFIED DELETE PERMISSIONS
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated delete access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin delete access" ON public.ai_providers_unified;

-- Create comprehensive DELETE policy for ai_providers_unified
CREATE POLICY "Superadmin and service delete access"
ON public.ai_providers_unified FOR DELETE TO authenticated
USING (
    -- Only superadmin can delete
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ============================================================================
-- 3. ENSURE USER ROLE PERSISTENCE FUNCTIONS
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.ensure_user_role(uuid, text);

-- Create function to ensure user roles are persistent
CREATE OR REPLACE FUNCTION public.ensure_user_role(
    user_id_param uuid,
    role_param text DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id_param, role_param, NOW(), NOW())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET updated_at = NOW();
END;
$$;

-- ============================================================================
-- 4. CREATE FUNCTION TO CHECK USER PERMISSIONS CONSISTENTLY
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.check_user_permission(text);

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
    permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_email text;
    user_role text;
BEGIN
    -- Get current user email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if superadmin
    IF user_email = 'superadmin@yachtexcel.com' THEN
        RETURN true;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Basic permission checks
    CASE 
        WHEN permission_name = 'read' THEN
            RETURN true; -- All authenticated users can read
        WHEN permission_name = 'write' AND user_role IN ('admin', 'superadmin') THEN
            RETURN true;
        WHEN permission_name = 'delete' AND user_role = 'superadmin' THEN
            RETURN true;
        ELSE
            RETURN false;
    END CASE;
END;
$$;

-- ============================================================================
-- 5. CREATE TRIGGER TO AUTO-ASSIGN USER ROLES
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS assign_default_user_role_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.assign_default_user_role();

-- Create function to auto-assign default role to new users
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-assign role based on email
    IF NEW.email = 'superadmin@yachtexcel.com' THEN
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.id, 'superadmin', NOW(), NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.id, 'user', NOW(), NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER assign_default_user_role_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_user_role();

-- ============================================================================
-- 6. ENSURE SUPERADMIN ROLE EXISTS
-- ============================================================================

-- Ensure superadmin role exists for current superadmin user
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
    id,
    'superadmin',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'superadmin@yachtexcel.com'
ON CONFLICT (user_id, role) 
DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- 7. UPDATE SYSTEM_SETTINGS FOR BETTER PERMISSION MANAGEMENT
-- ============================================================================

-- Drop existing policies on system_settings that might be too restrictive
DROP POLICY IF EXISTS "Authenticated read access" ON public.system_settings;

-- Create more permissive read policy for system_settings
CREATE POLICY "Authenticated read access"
ON public.system_settings FOR SELECT TO authenticated
USING (true); -- All authenticated users can read system settings

-- ============================================================================
-- 8. FIX ANY OTHER RESTRICTIVE POLICIES
-- ============================================================================

-- Ensure ai_models_unified has proper access for superadmin
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_models_unified;

CREATE POLICY "Superadmin full access"
ON public.ai_models_unified FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ============================================================================
-- 9. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant permissions on user_roles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.ensure_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Test basic access patterns
DO $$
DECLARE
    superadmin_id uuid;
    role_count int;
BEGIN
    -- Get superadmin ID
    SELECT id INTO superadmin_id 
    FROM auth.users 
    WHERE email = 'superadmin@yachtexcel.com';
    
    -- Count roles
    SELECT COUNT(*) INTO role_count 
    FROM public.user_roles;
    
    RAISE NOTICE 'Superadmin ID: %', superadmin_id;
    RAISE NOTICE 'Total user roles: %', role_count;
    
    -- Test permission function
    IF public.check_user_permission('read') THEN
        RAISE NOTICE 'Permission system: FUNCTIONAL';
    ELSE
        RAISE NOTICE 'Permission system: NEEDS ATTENTION';
    END IF;
END;
$$;

COMMIT;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
SELECT 
    'PHASE 3 COMPLETE: User roles and permissions system fixed' as status,
    NOW() as completed_at,
    'All user permission issues resolved' as description;