-- Fix missing RPC functions and permissions
-- This addresses the 404 errors for is_superadmin function

-- Create the missing is_superadmin function
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use current user if no user_id provided
  IF user_id_param IS NULL THEN
    user_id_param := auth.uid();
  END IF;
  
  -- Hardcoded superadmin recognition for primary admin users
  IF user_id_param = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
     user_id_param = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID THEN
    RETURN true;
  END IF;
  
  -- Also check by email for additional security
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND email = 'superadmin@yachtexcel.com'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check user_roles table for superadmin role (fallback)
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'superadmin'
    AND yacht_id IS NULL  -- Global superadmin
    AND is_active = true
  );
END;
$$;

-- Create parameterless version for current user
CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.is_superadmin(auth.uid());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin TO authenticated;

-- Fix yacht_profiles RLS policies to allow superadmin access
DROP POLICY IF EXISTS "Superadmin full access yacht_profiles" ON public.yacht_profiles;
CREATE POLICY "Superadmin full access yacht_profiles" ON public.yacht_profiles
  FOR ALL TO authenticated
  USING (
    -- Hardcoded superadmin users (always have access)
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    -- Check by email
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'superadmin@yachtexcel.com'
    ) OR
    -- Standard superadmin role check (fallback)
    public.is_superadmin(auth.uid()) OR
    -- Owner access
    auth.uid() = owner_id
  );

-- Ensure superadmin user role exists
INSERT INTO public.user_roles (user_id, role, yacht_id, is_active, created_by)
VALUES ('a751a50b-740c-4a38-a169-33185128fec5', 'superadmin', NULL, true, 'a751a50b-740c-4a38-a169-33185128fec5')
ON CONFLICT (user_id, yacht_id, role) DO NOTHING;