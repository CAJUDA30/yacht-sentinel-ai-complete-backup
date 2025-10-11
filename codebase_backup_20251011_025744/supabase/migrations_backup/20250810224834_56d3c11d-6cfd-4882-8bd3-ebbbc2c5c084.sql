
-- 1) Roles enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'moderator', 'user');
  END IF;
END$$;

-- 2) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3) Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4) Helper function: has_role(user_id, role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles r
    WHERE r.user_id = _user_id
      AND r.role = _role
  );
$$;

-- 5) Helper function: is_superadmin(user_id)
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'superadmin'::public.app_role);
$$;

-- 6) Policies
-- Allow superadmins to manage all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Superadmins can do anything on user_roles'
  ) THEN
    CREATE POLICY "Superadmins can do anything on user_roles"
      ON public.user_roles
      FOR ALL
      TO authenticated
      USING (public.is_superadmin(auth.uid()))
      WITH CHECK (public.is_superadmin(auth.uid()));
  END IF;
END$$;

-- Allow users to view their own roles (quality of life) in addition to superadmins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));
  END IF;
END$$;

-- 7) Optional: grant function execution (read-only helpers) to authenticated/anon
-- These are safe: they only return booleans and are SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO anon, authenticated;

-- 8) Secure bootstrap function: grant_role_by_email
-- Note: Do NOT grant this to anon/authenticated; it remains owner-only (supabase_admin)
CREATE OR REPLACE FUNCTION public.grant_role_by_email(_email text, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid
  FROM auth.users
  WHERE lower(email) = lower(_email)
  LIMIT 1;

  IF _uid IS NULL THEN
    -- User not found yet (has not signed up) -> return false; re-run after signup
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- 9) Bootstrap: attempt to grant superadmin to the provided email
-- If the user hasn't signed up yet, this returns FALSE (harmless).
SELECT public.grant_role_by_email('cajuda30@gmail.com', 'superadmin');
