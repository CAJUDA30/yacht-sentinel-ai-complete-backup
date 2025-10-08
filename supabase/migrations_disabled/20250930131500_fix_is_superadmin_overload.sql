-- Fix is_superadmin function to handle both parameter signatures

-- Create overloaded function that works without parameters (matches the app's call)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the result using the current authenticated user ID
  RETURN public.is_superadmin(auth.uid());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon;

-- Also fix the existing function to handle NULL user_id
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle NULL user_id case
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has superadmin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'superadmin'
  );
END;
$$;

-- Grant execute permissions for the parametered version too
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;