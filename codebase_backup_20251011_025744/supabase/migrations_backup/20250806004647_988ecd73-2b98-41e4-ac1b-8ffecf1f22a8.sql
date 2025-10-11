-- Fix security warning: Function Search Path Mutable
-- Update the function to have an immutable search_path
CREATE OR REPLACE FUNCTION public.get_user_yacht_access()
RETURNS TABLE(yacht_id UUID, access_level TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  -- Return yachts the current user owns
  SELECT id, 'owner' FROM yacht_profiles WHERE owner_id = auth.uid()
  UNION
  -- Return yachts the current user crews on
  SELECT yacht_id, 'crew' FROM crew_members WHERE user_id = auth.uid();
$$;