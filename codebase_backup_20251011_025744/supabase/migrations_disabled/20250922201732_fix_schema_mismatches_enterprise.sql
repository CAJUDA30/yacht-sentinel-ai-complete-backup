-- =====================================================
-- COMPREHENSIVE SCHEMA FIXES FOR YACHTEXCEL APP
-- Enterprise-Grade Schema Alignment
-- No shortcuts, no mock data - Production ready
-- =====================================================

-- 1. Create yacht_access_control table (CRITICAL for useYachtPermissions)
CREATE TABLE IF NOT EXISTS public.yacht_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  access_level TEXT NOT NULL DEFAULT 'crew',
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, yacht_id, role)
);

-- 2. Create role_permissions_matrix table (CRITICAL for permissions)
CREATE TABLE IF NOT EXISTS public.role_permissions_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  yacht_scope_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module_name)
);

-- 3. Create yacht_activity_log table (for log_yacht_activity function)
CREATE TABLE IF NOT EXISTS public.yacht_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  module_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 4. Create/Update get_user_yacht_access_detailed function with EXACT parameter name
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID);
CREATE FUNCTION public.get_user_yacht_access_detailed(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  yacht_id UUID,
  role TEXT,
  access_level TEXT,
  permissions JSONB,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    yac.yacht_id,
    yac.role,
    yac.access_level,
    yac.permissions,
    yac.is_active
  FROM yacht_access_control yac
  WHERE yac.user_id = p_user_id 
    AND yac.is_active = true
    AND (yac.expires_at IS NULL OR yac.expires_at > NOW())
  
  UNION ALL
  
  -- Include owned yachts automatically
  SELECT 
    yp.id as yacht_id,
    'owner' as role,
    'admin' as access_level,
    '{"all": true}'::jsonb as permissions,
    true as is_active
  FROM yacht_profiles yp
  WHERE yp.owner_id = p_user_id;
END;
$$;

-- 5. Create log_yacht_activity function (CRITICAL for useYachtPermissions)
CREATE OR REPLACE FUNCTION public.log_yacht_activity(
  p_yacht_id UUID,
  p_module_name TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT 'general',
  p_resource_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO yacht_activity_log (
    yacht_id,
    user_id,
    module_name,
    action_type,
    resource_type,
    resource_id,
    timestamp
  ) VALUES (
    p_yacht_id,
    auth.uid(),
    p_module_name,
    p_action_type,
    p_resource_type,
    p_resource_id,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently ignore logging errors to not break functionality
    NULL;
END;
$$;

-- 6. Insert default permissions for enterprise roles
INSERT INTO public.role_permissions_matrix (role, module_name, can_view, can_add, can_edit, can_approve, can_delete) 
VALUES 
  ('owner', 'all', true, true, true, true, true),
  ('manager', 'all', true, true, true, false, false),
  ('captain', 'navigation', true, true, true, true, false),
  ('captain', 'crew', true, true, true, true, false),
  ('captain', 'maintenance', true, true, true, false, false),
  ('first_officer', 'navigation', true, true, false, false, false),
  ('first_officer', 'crew', true, false, false, false, false),
  ('crew', 'general', true, false, false, false, false),
  ('viewer', 'general', true, false, false, false, false)
ON CONFLICT (role, module_name) DO NOTHING;

-- 7. Enable RLS on all tables
ALTER TABLE yacht_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_activity_log ENABLE ROW LEVEL SECURITY;

-- 8. Create enterprise-grade RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own yacht access"
  ON yacht_access_control FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Yacht owners can manage access control"
  ON yacht_access_control FOR ALL
  USING (
    yacht_id IN (
      SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Everyone can read permissions matrix"
  ON role_permissions_matrix FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can view activity for their yachts"
  ON yacht_activity_log FOR SELECT
  USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access_control 
      WHERE user_id = auth.uid()
    ) OR
    yacht_id IN (
      SELECT id FROM yacht_profiles 
      WHERE owner_id = auth.uid()
    )
  );

-- 9. Grant necessary permissions (CRITICAL)
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_yacht_activity(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT SELECT ON public.yacht_access_control TO authenticated;
GRANT SELECT ON public.role_permissions_matrix TO authenticated, anon;
GRANT SELECT ON public.yacht_activity_log TO authenticated;

-- 10. Create indexes for enterprise performance
CREATE INDEX IF NOT EXISTS idx_yacht_access_control_user_id ON yacht_access_control(user_id);
CREATE INDEX IF NOT EXISTS idx_yacht_access_control_yacht_id ON yacht_access_control(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_access_control_active ON yacht_access_control(user_id, yacht_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_yacht_activity_log_yacht_id ON yacht_activity_log(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_activity_log_timestamp ON yacht_activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_matrix_role_module ON role_permissions_matrix(role, module_name);

-- 11. Insert sample data for testing (enterprise owner access)
DO $$
BEGIN
  -- Add access control for existing yacht profiles
  INSERT INTO yacht_access_control (user_id, yacht_id, role, access_level, permissions)
  SELECT 
    owner_id,
    id,
    'owner',
    'admin',
    '{"all": true}'::jsonb
  FROM yacht_profiles
  WHERE owner_id IS NOT NULL
  ON CONFLICT (user_id, yacht_id, role) DO NOTHING;
END $$;

-- Success confirmation
SELECT 'Enterprise-grade schema fixes applied successfully!' as status;