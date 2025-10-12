-- SYSTEMATIC SUPERADMIN FIX - Single Source of Truth (Non-transactional)
-- This migration creates a definitive, foolproof superadmin system
-- Addresses core issues: UUID mismatch, conflicting RPC functions, missing role entries

-- 1. First ensure we have the correct is_superadmin function that prioritizes email
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    user_email TEXT;
BEGIN
    -- Use provided user_id or get current user
    target_user_id := COALESCE(_user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- PRIORITY 1: Email-based superadmin detection (HIGHEST PRIORITY)
    IF user_email = 'superadmin@yachtexcel.com' THEN
        RETURN TRUE;
    END IF;
    
    -- PRIORITY 2: Check user_roles table for explicit superadmin role
    IF EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = target_user_id 
        AND role = 'superadmin'
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Default: not superadmin
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;

-- 2. Create parameterless version for convenience
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.is_superadmin(auth.uid());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon;

-- 3. Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'user', 'manager', 'admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);

-- 5. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing conflicting policies with proper checks
DO $$
BEGIN
    -- Drop policies only if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles') THEN
        DROP POLICY "Users can view their own roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can insert their own roles') THEN
        DROP POLICY "Users can insert their own roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage all roles') THEN
        DROP POLICY "Admins can manage all roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Superadmins can manage all roles') THEN
        DROP POLICY "Superadmins can manage all roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Service role can manage all roles') THEN
        DROP POLICY "Service role can manage all roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_own_roles') THEN
        DROP POLICY "users_own_roles" ON public.user_roles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_read_own_roles') THEN
        DROP POLICY "users_read_own_roles" ON public.user_roles;
    END IF;
END $$;

-- 7. Create clean RLS policies
CREATE POLICY "Users can view their own roles" 
    ON public.user_roles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles" 
    ON public.user_roles FOR ALL 
    USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role can manage all roles" 
    ON public.user_roles FOR ALL 
    USING (auth.role() = 'service_role');

-- 8. CRITICAL: Insert/Update superadmin role for the current user
INSERT INTO public.user_roles (user_id, role, department, is_active, created_at)
SELECT 
    id, 
    'superadmin', 
    NULL,
    true, 
    NOW()
FROM auth.users 
WHERE email = 'superadmin@yachtexcel.com'
ON CONFLICT (user_id, role, COALESCE(department, ''))
DO UPDATE SET 
    is_active = true,
    updated_at = NOW();

-- 9. Create a helper function to ensure superadmin role on login
CREATE OR REPLACE FUNCTION public.ensure_superadmin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If user has superadmin email, ensure they have superadmin role
    IF NEW.email = 'superadmin@yachtexcel.com' THEN
        INSERT INTO public.user_roles (user_id, role, department, is_active, created_at)
        VALUES (NEW.id, 'superadmin', NULL, true, NOW())
        ON CONFLICT (user_id, role, COALESCE(department, ''))
        DO UPDATE SET 
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- 10. Create trigger to automatically assign superadmin role
DROP TRIGGER IF EXISTS ensure_superadmin_role_trigger ON auth.users;
CREATE TRIGGER ensure_superadmin_role_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email = 'superadmin@yachtexcel.com')
    EXECUTE FUNCTION public.ensure_superadmin_role();

-- 11. Clean up old conflicting functions if they exist
DROP FUNCTION IF EXISTS public.current_user_is_superadmin();

-- 12. Create helper functions for compatibility
CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.is_superadmin(auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin() TO authenticated, anon;

-- 13. Final verification and output
DO $$
DECLARE
    superuser_count INTEGER;
    function_exists BOOLEAN;
    user_found BOOLEAN;
BEGIN
    -- Check if we have superadmin users
    SELECT COUNT(*) INTO superuser_count
    FROM public.user_roles 
    WHERE role = 'superadmin' AND is_active = true;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_superadmin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO function_exists;
    
    -- Check if superadmin user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    ) INTO user_found;
    
    -- Log results
    RAISE NOTICE 'SYSTEMATIC SUPERADMIN FIX COMPLETE:';
    RAISE NOTICE '- Active superadmin users: %', superuser_count;
    RAISE NOTICE '- is_superadmin function exists: %', function_exists;
    RAISE NOTICE '- superadmin@yachtexcel.com user found: %', user_found;
    RAISE NOTICE '- Email-based detection: ENABLED (Priority 1)';
    RAISE NOTICE '- Database role detection: ENABLED (Priority 2)';
    RAISE NOTICE '- Auto-role assignment: ENABLED';
    RAISE NOTICE '- RLS policies: UPDATED';
    RAISE NOTICE '- Trigger for auto-assignment: ACTIVE';
END $$;