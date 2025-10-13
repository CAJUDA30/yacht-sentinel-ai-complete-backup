-- Fix RLS policies that query auth.users table causing circular permission issues
-- This systematic fix replaces table queries with JWT metadata checks

-- 1. Fix ai_providers_unified
DROP POLICY IF EXISTS superadmin_complete_access ON ai_providers_unified;
CREATE POLICY superadmin_complete_access ON ai_providers_unified FOR ALL 
USING (
  -- Check JWT claims for superadmin status (no table query needed)
  (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
  (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin'
);

-- 2. Fix ai_models_unified if it has similar policy
DROP POLICY IF EXISTS superadmin_complete_access ON ai_models_unified;
CREATE POLICY superadmin_complete_access ON ai_models_unified FOR ALL 
USING (
  (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
  (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin'
);

-- 3. Fix user_roles if it has similar policy
DROP POLICY IF EXISTS superadmin_manage_all_roles ON user_roles;
CREATE POLICY superadmin_manage_all_roles ON user_roles FOR ALL
USING (
  (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
  (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin'
);

-- 4. Fix system_settings if it has similar policy  
DROP POLICY IF EXISTS superadmin_full_access ON system_settings;
CREATE POLICY superadmin_full_access ON system_settings FOR ALL
USING (
  (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
  (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin'
);

-- 5. Fix document_ai_processors if it has similar policy
DROP POLICY IF EXISTS "Superadmins can manage processors" ON document_ai_processors;
CREATE POLICY "Superadmins can manage processors" ON document_ai_processors FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
  (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
  (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin'
);

-- Create a helper function to check if user is superadmin without querying users table
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    (auth.jwt() ->> 'email')::text = 'superadmin@yachtexcel.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
    (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true OR
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'superadmin';
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin() TO service_role;

-- Add comment
COMMENT ON FUNCTION is_superadmin() IS 'Check if current user is superadmin using JWT metadata without querying users table to avoid circular RLS issues';

-- Verify all policies are now using JWT-based checks
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.users%' THEN '❌ Still queries users table'
    WHEN qual LIKE '%auth.jwt()%' THEN '✅ Uses JWT metadata'
    ELSE '⚠️ Unknown pattern'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('ai_providers_unified', 'ai_models_unified', 'user_roles', 'system_settings', 'document_ai_processors')
  AND policyname LIKE '%superadmin%'
ORDER BY tablename, policyname;