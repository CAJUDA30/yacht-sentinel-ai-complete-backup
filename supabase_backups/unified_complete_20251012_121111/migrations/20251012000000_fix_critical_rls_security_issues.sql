-- ============================================================================
-- FIX CRITICAL RLS SECURITY ISSUES - PHASE 1 URGENT FIXES
-- ============================================================================
-- Based on comprehensive RLS audit findings
-- Addresses 3 critical security vulnerabilities and standardizes policies

-- ============================================================================
-- 1. FIX AI_SYSTEM_CONFIG - CRITICAL SECURITY ISSUE
-- ============================================================================
-- Issue: ALL authenticated users can delete system configuration
-- Risk: System corruption, unauthorized config deletion
-- Fix: Restrict DELETE to superadmin only

-- Remove overly permissive DELETE policy
DROP POLICY IF EXISTS "Authenticated delete access" ON public.ai_system_config;

-- Add DELETE policy restricted to superadmin only
CREATE POLICY "Superadmin delete access" 
ON public.ai_system_config
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Add superadmin full access policy for consistency (if not exists)
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_system_config;
CREATE POLICY "Superadmin full access"
ON public.ai_system_config
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

-- ============================================================================
-- 2. FIX AUDIT_WORKFLOWS - CRITICAL SECURITY ISSUE
-- ============================================================================  
-- Issue: ALL authenticated users can delete audit records
-- Risk: Audit trail tampering, compliance violations
-- Fix: Restrict DELETE to superadmin only

-- Remove overly permissive DELETE policy
DROP POLICY IF EXISTS "Authenticated delete access" ON public.audit_workflows;

-- Add DELETE policy restricted to superadmin only
CREATE POLICY "Superadmin delete access"
ON public.audit_workflows  
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Add superadmin full access policy for consistency (if not exists)
DROP POLICY IF EXISTS "Superadmin full access" ON public.audit_workflows;
CREATE POLICY "Superadmin full access"
ON public.audit_workflows
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

-- ============================================================================
-- 3. FIX INVENTORY_ITEMS - CRITICAL SECURITY ISSUE
-- ============================================================================
-- Issue: ALL authenticated users can delete any inventory item
-- Risk: Data loss, unauthorized inventory manipulation  
-- Fix: Restrict DELETE to owner or superadmin only

-- Remove overly permissive DELETE policy
DROP POLICY IF EXISTS "Authenticated delete access" ON public.inventory_items;

-- Add DELETE policy restricted to yacht owner or superadmin
CREATE POLICY "Yacht owner and superadmin delete access"
ON public.inventory_items
FOR DELETE  
TO authenticated
USING (
    -- Yacht owner can delete items from their yacht
    yacht_id IN (
        SELECT id FROM public.yachts 
        WHERE owner_id = auth.uid()
    )
    OR
    -- Superadmin can delete any item
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Add superadmin full access policy for consistency (if not exists)
DROP POLICY IF EXISTS "Superadmin full access" ON public.inventory_items;
CREATE POLICY "Superadmin full access"
ON public.inventory_items
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

-- ============================================================================
-- 4. FIX AI_MODELS_UNIFIED - MISSING DELETE RESTRICTIONS
-- ============================================================================
-- Issue: No DELETE policy defined (defaults to deny, but should be explicit)
-- Fix: Add explicit DELETE policy restricted to superadmin

CREATE POLICY "Superadmin delete access"
ON public.ai_models_unified
FOR DELETE
TO authenticated  
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ============================================================================
-- 5. CLEAN UP SYSTEM_SETTINGS REDUNDANT POLICIES
-- ============================================================================
-- Issue: Has both "Authenticated delete access" AND "Superadmin full access" 
-- Fix: Remove redundant policy, keep superadmin-only access

-- The "Authenticated delete access" on system_settings is actually properly 
-- restricted to superadmin, but it's redundant with "Superadmin full access"
-- Keep it for now as it's properly secured, but add comment for future cleanup

COMMENT ON POLICY "Authenticated delete access" ON public.system_settings 
IS 'REDUNDANT: This policy duplicates Superadmin full access DELETE. Consider removing in future cleanup.';

-- ============================================================================
-- 6. ADD MISSING SUPERADMIN POLICIES FOR CONSISTENCY
-- ============================================================================

-- Add superadmin full access to tables that are missing it
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_health;
CREATE POLICY "Superadmin full access"
ON public.ai_health
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

-- Add missing INSERT/UPDATE policies to ai_health
DROP POLICY IF EXISTS "Authenticated insert access" ON public.ai_health;
CREATE POLICY "Authenticated insert access"
ON public.ai_health
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_health;
CREATE POLICY "Authenticated update access"  
ON public.ai_health
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add DELETE restriction to ai_health
DROP POLICY IF EXISTS "Superadmin delete access" ON public.ai_health;
CREATE POLICY "Superadmin delete access"
ON public.ai_health
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ============================================================================
-- 7. VERIFICATION AND LOGGING
-- ============================================================================

-- Log the fixes applied
DO $$
BEGIN
    RAISE NOTICE '🔒 CRITICAL RLS SECURITY FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '✅ Fixed ai_system_config DELETE permissions (superadmin only)';
    RAISE NOTICE '✅ Fixed audit_workflows DELETE permissions (superadmin only)'; 
    RAISE NOTICE '✅ Fixed inventory_items DELETE permissions (owner + superadmin)';
    RAISE NOTICE '✅ Added ai_models_unified DELETE restrictions (superadmin only)';
    RAISE NOTICE '✅ Enhanced ai_health policies (INSERT/UPDATE/DELETE)';
    RAISE NOTICE '✅ Added missing superadmin policies for consistency';
    RAISE NOTICE '🚨 SECURITY VULNERABILITIES RESOLVED!';
END
$$;

-- Verify superadmin user exists
DO $$  
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN
        RAISE NOTICE '✅ Superadmin user verified: superadmin@yachtexcel.com';
    ELSE
        RAISE NOTICE '❌ WARNING: Superadmin user NOT found! Policies will not work correctly.';
    END IF;
END
$$;

-- ============================================================================
-- MIGRATION COMPLETE - PHASE 1 CRITICAL FIXES
-- ============================================================================