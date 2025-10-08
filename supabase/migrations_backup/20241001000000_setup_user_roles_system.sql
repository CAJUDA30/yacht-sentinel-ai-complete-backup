-- User Roles System Setup Migration
-- Complete system for permanent user role management

-- 1. Create user_roles table with proper constraints
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles(user_id, role, is_active);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Create comprehensive RLS policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role has full access (for server-side operations)
CREATE POLICY "Service role can manage all roles" 
  ON public.user_roles FOR ALL 
  USING (auth.role() = 'service_role');

-- Superadmins can manage all roles
CREATE POLICY "Superadmins can manage all roles" 
  ON public.user_roles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'superadmin' 
      AND is_active = true
    )
  );

-- Admins can manage user, viewer, and manager roles
CREATE POLICY "Admins can manage lower roles" 
  ON public.user_roles FOR ALL 
  USING (
    role IN ('user', 'viewer', 'manager') AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin') 
      AND is_active = true
    )
  );

-- 6. Create utility functions
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for superadmin role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND role = 'superadmin'
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT ur.role, ur.created_at, ur.updated_at, ur.is_active
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id
  ORDER BY 
    CASE ur.role 
      WHEN 'superadmin' THEN 5 
      WHEN 'admin' THEN 4 
      WHEN 'manager' THEN 3 
      WHEN 'user' THEN 2 
      WHEN 'viewer' THEN 1 
      ELSE 0 
    END DESC,
    ur.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
  primary_role TEXT;
BEGIN
  target_user_id := COALESCE(_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN 'viewer';
  END IF;
  
  -- Get the highest role
  SELECT ur.role INTO primary_role
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id AND ur.is_active = true
  ORDER BY 
    CASE ur.role 
      WHEN 'superadmin' THEN 5 
      WHEN 'admin' THEN 4 
      WHEN 'manager' THEN 3 
      WHEN 'user' THEN 2 
      WHEN 'viewer' THEN 1 
      ELSE 0 
    END DESC
  LIMIT 1;
  
  RETURN COALESCE(primary_role, 'user');
END;
$$;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id UUID, _role TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF _role NOT IN ('viewer', 'user', 'manager', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Invalid role: %', _role;
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, created_by, is_active)
  VALUES (_user_id, _role, auth.uid(), true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    updated_at = NOW(),
    created_by = auth.uid();
    
  RETURN true;
END;
$$;

-- 7. Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;

-- 8. Create trigger for automatic role assignment to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is the designated superadmin user
  IF NEW.id = '6d201176-5be1-45d4-b09f-f70cb4ad38ac' OR NEW.email = 'superadmin@yachtexcel.com' THEN
    -- Assign superadmin role
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.id, 'superadmin', NEW.id)
    ON CONFLICT (user_id, role) DO UPDATE SET
      is_active = true,
      updated_at = NOW();
  ELSE
    -- Assign default 'user' role to regular users
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.id, 'user', NEW.id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_signup();
  END IF;
END $$;

-- 9. Function to setup superadmin role (to be called after user login)
CREATE OR REPLACE FUNCTION public.setup_superadmin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert superadmin role for the designated user if they exist
  INSERT INTO public.user_roles (user_id, role, created_by, is_active)
  SELECT '6d201176-5be1-45d4-b09f-f70cb4ad38ac', 'superadmin', '6d201176-5be1-45d4-b09f-f70cb4ad38ac', true
  WHERE EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'
  )
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    updated_at = NOW();
    
  -- Also handle by email if the user exists
  INSERT INTO public.user_roles (user_id, role, created_by, is_active)
  SELECT u.id, 'superadmin', u.id, true
  FROM auth.users u
  WHERE u.email = 'superadmin@yachtexcel.com'
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    updated_at = NOW();
    
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_superadmin_role() TO authenticated, anon;

-- 10. Create a view for easy role queries
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  ur.id,
  ur.user_id,
  u.email,
  ur.role,
  ur.is_active,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.user_roles_view TO authenticated;

-- 11. Comment the table and functions
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments with hierarchy support';
COMMENT ON FUNCTION public.is_superadmin(UUID) IS 'Check if user has superadmin role';
COMMENT ON FUNCTION public.get_user_roles(UUID) IS 'Get all roles for a user';
COMMENT ON FUNCTION public.get_user_primary_role(UUID) IS 'Get the highest role for a user';
COMMENT ON FUNCTION public.assign_user_role(UUID, TEXT) IS 'Assign a role to a user';