-- Fix infinite recursion in RLS policies
-- The issue: ai_providers_unified RLS policy queries user_roles, which has its own RLS causing recursion

-- Drop all existing policies on ai_providers_unified
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_access_ai_providers_unified" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.ai_providers_unified;

-- Create simple, non-recursive policies
-- Policy 1: Service role has full access
CREATE POLICY "Service role full access"
ON public.ai_providers_unified
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read
CREATE POLICY "Authenticated read access"
ON public.ai_providers_unified
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Superadmin can do everything (using simple email check, no table lookup)
CREATE POLICY "Superadmin full access"
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

-- Policy 4: Authenticated users can insert/update (for API key configuration)
CREATE POLICY "Authenticated write access"
ON public.ai_providers_unified
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.ai_providers_unified
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Similarly fix ai_models_unified policies (prevent future issues)
DROP POLICY IF EXISTS "Allow superadmin full access to ai_models_unified" ON public.ai_models_unified;
DROP POLICY IF EXISTS "Allow authenticated users to read ai_models_unified" ON public.ai_models_unified;
DROP POLICY IF EXISTS "Service role full access to ai_models_unified" ON public.ai_models_unified;

-- Recreate with same pattern
CREATE POLICY "Service role full access"
ON public.ai_models_unified
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.ai_models_unified
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.ai_models_unified
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

CREATE POLICY "Authenticated write access"
ON public.ai_models_unified
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.ai_models_unified
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Superadmin full access" ON public.ai_providers_unified IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup';
COMMENT ON POLICY "Superadmin full access" ON public.ai_models_unified IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup';
