-- Fix critical infinite recursion in crew_members RLS policies and security issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view crew on their yachts" ON crew_members;
DROP POLICY IF EXISTS "Yacht owners and captains can manage crew" ON crew_members;

-- Create security definer function to get user yacht access
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_safe()
RETURNS TABLE(yacht_id uuid, access_level text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id as yacht_id, 'owner' as access_level 
  FROM yacht_profiles 
  WHERE owner_id = auth.uid()
  
  UNION
  
  SELECT y.yacht_id, 'crew' as access_level
  FROM (
    SELECT DISTINCT yacht_id
    FROM crew_members 
    WHERE user_id = auth.uid()
  ) y;
$$;

-- Fix sync_ai_provider_status function with proper search path
CREATE OR REPLACE FUNCTION public.sync_ai_provider_status()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update provider status based on health checks
  UPDATE ai_providers p
  SET updated_at = now()
  FROM ai_health h
  WHERE p.id = h.provider_id
  AND h.status != 'unknown';
END;
$$;

-- Create new safe RLS policies for crew_members
CREATE POLICY "crew_members_select_policy" ON crew_members
FOR SELECT
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "crew_members_insert_policy" ON crew_members
FOR INSERT
WITH CHECK (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
    WHERE access_level = 'owner'
  )
);

CREATE POLICY "crew_members_update_policy" ON crew_members
FOR UPDATE
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
    WHERE access_level = 'owner'
  ) OR (user_id = auth.uid() AND position IN ('captain', 'first_officer'))
);

CREATE POLICY "crew_members_delete_policy" ON crew_members
FOR DELETE
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
    WHERE access_level = 'owner'
  )
);