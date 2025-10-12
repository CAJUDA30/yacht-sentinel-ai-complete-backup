-- Fix RLS policies for user_roles table to allow SELECT operations
-- This fixes the 403 Forbidden errors when querying user_roles

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users access" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view team roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;

-- Create separate policies for different operations

-- 1. SELECT Policy: Allow authenticated users to read their own roles or if they're superadmin
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  -- Users can see their own roles
  auth.uid() = user_id
  OR
  -- Superadmins can see all roles
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'superadmin'
  )
);

-- 2. INSERT Policy: Only superadmins or system can create roles
CREATE POLICY "user_roles_insert_policy"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Superadmins can create any role
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'superadmin'
  )
  OR
  -- Users can only create their own initial role during signup
  (user_id = auth.uid() AND role = 'user')
);

-- 3. UPDATE Policy: Only superadmins can modify roles
CREATE POLICY "user_roles_update_policy"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'superadmin'
  )
);

-- 4. DELETE Policy: Only superadmins can delete roles
CREATE POLICY "user_roles_delete_policy"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'superadmin'
  )
);

-- Service role always has full access (keep existing policy)
-- The "Service role full access" policy already exists and should remain