-- Create the is_superadmin RPC function for Revolutionary SmartScan SuperAdmin access

-- First, ensure we have the user_roles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY IF NOT EXISTS "Users can view their own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage all roles" 
  ON public.user_roles FOR ALL 
  USING (auth.role() = 'service_role');

-- Create the is_superadmin RPC function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has superadmin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'superadmin'
  );
END;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;

-- Insert superadmin role for the current superadmin user (if not already exists)
-- Using the user ID from the logs: 6d201176-5be1-45d4-b09f-f70cb4ad38ac
INSERT INTO public.user_roles (user_id, role) 
VALUES ('6d201176-5be1-45d4-b09f-f70cb4ad38ac', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a helper function to check current user's superadmin status
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