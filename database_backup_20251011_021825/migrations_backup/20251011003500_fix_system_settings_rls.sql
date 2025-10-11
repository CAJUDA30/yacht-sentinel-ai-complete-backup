-- Fix system_settings RLS policies to prevent infinite recursion
-- The existing "Enable superadmin access" policy likely queries user_roles causing recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.system_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_access_system_settings" ON public.system_settings;

-- Create simple, non-recursive policies
-- Policy 1: Service role has full access
CREATE POLICY "Service role full access"
ON public.system_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read
CREATE POLICY "Authenticated read access"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Superadmin can do everything (using simple email check, no table lookup)
CREATE POLICY "Superadmin full access"
ON public.system_settings
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

-- Policy 4: Authenticated users can insert/update (for configuration)
CREATE POLICY "Authenticated write access"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete access"
ON public.system_settings
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Add comment
COMMENT ON POLICY "Superadmin full access" ON public.system_settings IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup';
