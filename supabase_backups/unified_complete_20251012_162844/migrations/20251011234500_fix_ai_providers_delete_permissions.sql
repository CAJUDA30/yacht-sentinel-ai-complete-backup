-- ============================================================================
-- FIX AI PROVIDERS DELETE PERMISSIONS - COMPREHENSIVE SOLUTION
-- ============================================================================
-- Issue: Superadmin getting 403 Forbidden when deleting ai_providers_unified records
-- Root Cause: Conflicting RLS policies preventing DELETE operations
-- Solution: Clean up and create unified, non-conflicting policies

-- ============================================================================
-- 1. BACKUP CURRENT STATE
-- ============================================================================
-- Log current policies for debugging
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT AI_PROVIDERS_UNIFIED POLICIES BEFORE FIX ===';
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'ai_providers_unified'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: % | Using: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles, 
            policy_record.qual;
    END LOOP;
END
$$;

-- ============================================================================
-- 2. CLEAN UP ALL EXISTING CONFLICTING POLICIES
-- ============================================================================

-- Drop ALL existing policies on ai_providers_unified to start fresh
DROP POLICY IF EXISTS "Service role full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated write access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin and service delete access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated write" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.ai_providers_unified;

-- ============================================================================
-- 3. CREATE UNIFIED, NON-CONFLICTING RLS POLICIES
-- ============================================================================

-- Policy 1: Service role gets complete access (highest priority)
CREATE POLICY "service_role_full_access_ai_providers"
ON public.ai_providers_unified
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Superadmin gets complete access (email-based, no recursion)
CREATE POLICY "superadmin_full_access_ai_providers"
ON public.ai_providers_unified
FOR ALL
TO authenticated
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

-- Policy 3: Regular authenticated users get read-only access
CREATE POLICY "authenticated_read_access_ai_providers"
ON public.ai_providers_unified
FOR SELECT
TO authenticated
USING (true);

-- Policy 4: Regular authenticated users can insert (for setup/configuration)
CREATE POLICY "authenticated_insert_access_ai_providers"
ON public.ai_providers_unified
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 5: Regular authenticated users can update (for configuration changes)
CREATE POLICY "authenticated_update_access_ai_providers"
ON public.ai_providers_unified
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. VERIFY POLICY SETUP
-- ============================================================================

-- Log new policies for verification
DO $$
DECLARE
    policy_record RECORD;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== NEW AI_PROVIDERS_UNIFIED POLICIES AFTER FIX ===';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'ai_providers_unified';
    
    RAISE NOTICE 'Total policies created: %', policy_count;
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'ai_providers_unified'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
    
    -- Verify superadmin user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN
        RAISE NOTICE '✅ Superadmin user found: superadmin@yachtexcel.com';
    ELSE
        RAISE NOTICE '❌ WARNING: Superadmin user NOT found!';
    END IF;
END
$$;

-- ============================================================================
-- 5. TEST THE POLICIES (OPTIONAL VERIFICATION)
-- ============================================================================

-- Comment: The policies above should now allow:
-- ✅ service_role: Full access (SELECT, INSERT, UPDATE, DELETE)
-- ✅ superadmin@yachtexcel.com: Full access (SELECT, INSERT, UPDATE, DELETE)  
-- ✅ authenticated users: Read + Insert + Update (SELECT, INSERT, UPDATE)
-- ❌ authenticated users: No DELETE (only superadmin can delete)

-- Add comments for documentation
COMMENT ON POLICY "service_role_full_access_ai_providers" ON public.ai_providers_unified 
IS 'Service role has unrestricted access to ai_providers_unified table';

COMMENT ON POLICY "superadmin_full_access_ai_providers" ON public.ai_providers_unified 
IS 'Superadmin (superadmin@yachtexcel.com) has full CRUD access including DELETE operations';

COMMENT ON POLICY "authenticated_read_access_ai_providers" ON public.ai_providers_unified 
IS 'All authenticated users can read ai_providers_unified records';

COMMENT ON POLICY "authenticated_insert_access_ai_providers" ON public.ai_providers_unified 
IS 'All authenticated users can create new ai_providers_unified records';

COMMENT ON POLICY "authenticated_update_access_ai_providers" ON public.ai_providers_unified 
IS 'All authenticated users can update ai_providers_unified records';

-- ============================================================================
-- 6. ENSURE TABLE CONSTRAINTS AND STRUCTURE
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;

-- Verify table exists and has required structure
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_providers_unified') THEN
        RAISE EXCEPTION 'FATAL: ai_providers_unified table does not exist!';
    END IF;
    
    -- Check if id column exists 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_providers_unified' AND column_name = 'id') THEN
        RAISE EXCEPTION 'FATAL: ai_providers_unified table missing id column!';
    END IF;
    
    RAISE NOTICE '✅ Table structure verification passed';
END
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final status
DO $$
BEGIN
    RAISE NOTICE '🎉 AI Providers DELETE permissions fix completed successfully!';
    RAISE NOTICE '📧 Superadmin: superadmin@yachtexcel.com can now DELETE ai providers';
    RAISE NOTICE '👥 Regular users: Can SELECT, INSERT, UPDATE (but not DELETE)';
    RAISE NOTICE '🔧 Service role: Full access to all operations';
    RAISE NOTICE '⚡ All policies are non-recursive and optimized for performance';
END
$$;