-- YachtExcel Master System: Comprehensive RBAC and Yacht-Centric Architecture
-- Implements the core architecture principles from the master system prompt

-- =============================================
-- 1. Enhanced Role System with Rank-Based Crew Access
-- =============================================

-- Drop existing role type and recreate with complete hierarchy
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM (
  'superadmin',      -- Platform Level: Full visibility across all yachts
  'owner',           -- Fleet Level: Multiple yachts ownership
  'manager',         -- Fleet Level: Multiple yachts management
  'captain',         -- Yacht Level: Full control within yachtId
  'first_officer',   -- Yacht Level: Navigation + safety + maintenance checks
  'chief_engineer',  -- Yacht Level: Full maintenance, logs, equipment docs, limited finance
  'chief_steward',   -- Yacht Level: Guest/itinerary + inventory + provisioning
  'engineer',        -- Yacht Level: Maintenance tasks + equipment access
  'deckhand',        -- Yacht Level: Limited maintenance tasks + assigned jobs
  'steward',         -- Yacht Level: Guest services + basic inventory
  'chef',            -- Yacht Level: Provisioning + vendor requests
  'security',        -- Yacht Level: Security systems + monitoring
  'guest',           -- Yacht Level: Limited read-only access
  'vendor'           -- External: Restricted to own invoices/contracts
);

-- Create comprehensive crew rank permissions matrix
CREATE TABLE IF NOT EXISTS public.role_permissions_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  yacht_scope_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, module_name)
);

-- =============================================
-- 2. Yacht-Centric Data Architecture
-- =============================================

-- Enhanced yacht access control with detailed permissions
CREATE TABLE IF NOT EXISTS public.yacht_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  role public.app_role NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'crew', -- 'owner', 'manager', 'captain', 'crew'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, yacht_id, role)
);

-- Fleet management relationships (aggregation layer above yachts)
CREATE TABLE IF NOT EXISTS public.fleet_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_name TEXT NOT NULL,
  owner_entity_id UUID NOT NULL,
  manager_entity_id UUID,
  yacht_ids UUID[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User to fleet access (for owners/managers with multiple yachts)
CREATE TABLE IF NOT EXISTS public.user_fleet_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fleet_id UUID NOT NULL REFERENCES public.fleet_management(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('owner', 'manager', 'viewer')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, fleet_id)
);

-- =============================================
-- 3. Comprehensive Module Tracking
-- =============================================

-- Every action must be linked to yachtId and log userId + module
CREATE TABLE IF NOT EXISTS public.yacht_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve'
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX (yacht_id, timestamp DESC),
  INDEX (user_id, timestamp DESC),
  INDEX (module_name, timestamp DESC)
);

-- =============================================
-- 4. Yacht Dashboard Configuration
-- =============================================

-- Yacht dashboard layout and panel configuration
CREATE TABLE IF NOT EXISTS public.yacht_dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- NULL for yacht default, specific for user custom
  layout_config JSONB NOT NULL DEFAULT '{
    "panels": {
      "crew_status": {"enabled": true, "position": 1, "size": "medium"},
      "finance_summary": {"enabled": true, "position": 2, "size": "medium"},
      "maintenance_alerts": {"enabled": true, "position": 3, "size": "large"},
      "certificates": {"enabled": true, "position": 4, "size": "small"},
      "itinerary": {"enabled": true, "position": 5, "size": "medium"},
      "documents": {"enabled": true, "position": 6, "size": "small"},
      "vendors": {"enabled": true, "position": 7, "size": "small"},
      "tasks_alerts": {"enabled": true, "position": 8, "size": "medium"}
    },
    "quick_actions": ["add_crew", "upload_certificate", "log_maintenance", "add_expense"],
    "widgets": {
      "weather": {"enabled": true, "position": "sidebar"},
      "ai_recommendations": {"enabled": true, "position": "sidebar"},
      "notifications": {"enabled": true, "position": "sidebar"}
    }
  }',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(yacht_id, user_id)
);

-- =============================================
-- 5. Insert Role Permissions Matrix
-- =============================================

-- Clear existing permissions and insert comprehensive matrix
DELETE FROM public.role_permissions_matrix;

INSERT INTO public.role_permissions_matrix (role, module_name, can_view, can_add, can_edit, can_approve, can_delete) VALUES
-- SuperAdmin (Platform Level) - Full access to everything
('superadmin', 'crew', true, true, true, true, true),
('superadmin', 'certificates', true, true, true, true, true),
('superadmin', 'finance', true, true, true, true, true),
('superadmin', 'maintenance', true, true, true, true, true),
('superadmin', 'equipment', true, true, true, true, true),
('superadmin', 'itinerary', true, true, true, true, true),
('superadmin', 'guests', true, true, true, true, true),
('superadmin', 'documents', true, true, true, true, true),
('superadmin', 'vendors', true, true, true, true, true),
('superadmin', 'tasks', true, true, true, true, true),
('superadmin', 'inventory', true, true, true, true, true),
('superadmin', 'system', true, true, true, true, true),

-- Owner (Fleet Level) - Full access within owned yachts
('owner', 'crew', true, true, true, true, true),
('owner', 'certificates', true, true, true, true, true),
('owner', 'finance', true, true, true, true, true),
('owner', 'maintenance', true, true, true, true, false),
('owner', 'equipment', true, true, true, true, false),
('owner', 'itinerary', true, true, true, true, false),
('owner', 'guests', true, true, true, true, false),
('owner', 'documents', true, true, true, true, false),
('owner', 'vendors', true, true, true, true, true),
('owner', 'tasks', true, true, true, true, true),
('owner', 'inventory', true, true, true, true, false),

-- Manager (Fleet Level) - Management access across managed yachts
('manager', 'crew', true, true, true, true, false),
('manager', 'certificates', true, false, true, true, false),
('manager', 'finance', true, false, false, true, false),
('manager', 'maintenance', true, false, false, true, false),
('manager', 'equipment', true, false, false, false, false),
('manager', 'itinerary', true, true, true, true, false),
('manager', 'guests', true, true, true, true, false),
('manager', 'documents', true, false, false, false, false),
('manager', 'vendors', true, true, true, true, false),
('manager', 'tasks', true, true, true, true, false),
('manager', 'inventory', true, false, false, false, false),

-- Captain (Yacht Level) - Full control within their yacht
('captain', 'crew', true, true, true, true, true),
('captain', 'certificates', true, true, true, true, false),
('captain', 'finance', true, true, true, false, false),
('captain', 'maintenance', true, true, true, true, false),
('captain', 'equipment', true, true, true, true, false),
('captain', 'itinerary', true, true, true, true, false),
('captain', 'guests', true, true, true, true, false),
('captain', 'documents', true, true, true, false, false),
('captain', 'vendors', true, true, true, true, false),
('captain', 'tasks', true, true, true, true, false),
('captain', 'inventory', true, true, true, false, false),

-- First Officer - Navigation + Safety + Maintenance checks
('first_officer', 'crew', true, false, false, false, false),
('first_officer', 'certificates', true, false, false, false, false),
('first_officer', 'finance', false, false, false, false, false),
('first_officer', 'maintenance', true, true, true, false, false),
('first_officer', 'equipment', true, false, true, false, false),
('first_officer', 'itinerary', true, true, true, false, false),
('first_officer', 'guests', true, false, false, false, false),
('first_officer', 'documents', true, false, false, false, false),
('first_officer', 'vendors', false, false, false, false, false),
('first_officer', 'tasks', true, true, true, false, false),
('first_officer', 'inventory', true, false, false, false, false),

-- Chief Engineer - Full maintenance, equipment, limited finance
('chief_engineer', 'crew', true, false, false, false, false),
('chief_engineer', 'certificates', true, false, false, false, false),
('chief_engineer', 'finance', true, true, false, false, false),
('chief_engineer', 'maintenance', true, true, true, true, false),
('chief_engineer', 'equipment', true, true, true, true, false),
('chief_engineer', 'itinerary', false, false, false, false, false),
('chief_engineer', 'guests', false, false, false, false, false),
('chief_engineer', 'documents', true, true, true, false, false),
('chief_engineer', 'vendors', true, true, true, false, false),
('chief_engineer', 'tasks', true, true, true, false, false),
('chief_engineer', 'inventory', true, true, true, false, false),

-- Chief Steward - Guest/itinerary + inventory + provisioning
('chief_steward', 'crew', true, false, false, false, false),
('chief_steward', 'certificates', false, false, false, false, false),
('chief_steward', 'finance', false, false, false, false, false),
('chief_steward', 'maintenance', false, false, false, false, false),
('chief_steward', 'equipment', false, false, false, false, false),
('chief_steward', 'itinerary', true, true, true, false, false),
('chief_steward', 'guests', true, true, true, false, false),
('chief_steward', 'documents', true, false, false, false, false),
('chief_steward', 'vendors', true, true, false, false, false),
('chief_steward', 'tasks', true, true, true, false, false),
('chief_steward', 'inventory', true, true, true, false, false),

-- Engineer - Maintenance tasks + equipment access
('engineer', 'crew', false, false, false, false, false),
('engineer', 'certificates', false, false, false, false, false),
('engineer', 'finance', false, false, false, false, false),
('engineer', 'maintenance', true, true, true, false, false),
('engineer', 'equipment', true, false, true, false, false),
('engineer', 'itinerary', false, false, false, false, false),
('engineer', 'guests', false, false, false, false, false),
('engineer', 'documents', true, false, false, false, false),
('engineer', 'vendors', false, false, false, false, false),
('engineer', 'tasks', true, true, true, false, false),
('engineer', 'inventory', true, false, false, false, false),

-- Deckhand - Limited maintenance tasks + assigned jobs
('deckhand', 'crew', false, false, false, false, false),
('deckhand', 'certificates', false, false, false, false, false),
('deckhand', 'finance', false, false, false, false, false),
('deckhand', 'maintenance', true, true, false, false, false),
('deckhand', 'equipment', true, false, false, false, false),
('deckhand', 'itinerary', false, false, false, false, false),
('deckhand', 'guests', false, false, false, false, false),
('deckhand', 'documents', false, false, false, false, false),
('deckhand', 'vendors', false, false, false, false, false),
('deckhand', 'tasks', true, false, true, false, false),
('deckhand', 'inventory', true, false, false, false, false),

-- Steward - Guest services + basic inventory
('steward', 'crew', false, false, false, false, false),
('steward', 'certificates', false, false, false, false, false),
('steward', 'finance', false, false, false, false, false),
('steward', 'maintenance', false, false, false, false, false),
('steward', 'equipment', false, false, false, false, false),
('steward', 'itinerary', true, false, false, false, false),
('steward', 'guests', true, true, true, false, false),
('steward', 'documents', false, false, false, false, false),
('steward', 'vendors', false, false, false, false, false),
('steward', 'tasks', true, false, true, false, false),
('steward', 'inventory', true, false, false, false, false),

-- Chef - Provisioning + vendor requests
('chef', 'crew', false, false, false, false, false),
('chef', 'certificates', false, false, false, false, false),
('chef', 'finance', false, false, false, false, false),
('chef', 'maintenance', false, false, false, false, false),
('chef', 'equipment', false, false, false, false, false),
('chef', 'itinerary', true, false, false, false, false),
('chef', 'guests', true, false, false, false, false),
('chef', 'documents', false, false, false, false, false),
('chef', 'vendors', true, true, false, false, false),
('chef', 'tasks', true, true, true, false, false),
('chef', 'inventory', true, true, true, false, false),

-- Security - Security systems + monitoring
('security', 'crew', true, false, false, false, false),
('security', 'certificates', true, false, false, false, false),
('security', 'finance', false, false, false, false, false),
('security', 'maintenance', false, false, false, false, false),
('security', 'equipment', true, false, false, false, false),
('security', 'itinerary', true, false, false, false, false),
('security', 'guests', true, false, false, false, false),
('security', 'documents', true, false, false, false, false),
('security', 'vendors', false, false, false, false, false),
('security', 'tasks', true, true, true, false, false),
('security', 'inventory', false, false, false, false, false),

-- Guest - Limited read-only access
('guest', 'crew', false, false, false, false, false),
('guest', 'certificates', false, false, false, false, false),
('guest', 'finance', false, false, false, false, false),
('guest', 'maintenance', false, false, false, false, false),
('guest', 'equipment', false, false, false, false, false),
('guest', 'itinerary', true, false, false, false, false),
('guest', 'guests', false, false, false, false, false),
('guest', 'documents', false, false, false, false, false),
('guest', 'vendors', false, false, false, false, false),
('guest', 'tasks', false, false, false, false, false),
('guest', 'inventory', false, false, false, false, false),

-- Vendor - Restricted to own invoices/contracts
('vendor', 'crew', false, false, false, false, false),
('vendor', 'certificates', false, false, false, false, false),
('vendor', 'finance', true, true, false, false, false),
('vendor', 'maintenance', false, false, false, false, false),
('vendor', 'equipment', false, false, false, false, false),
('vendor', 'itinerary', false, false, false, false, false),
('vendor', 'guests', false, false, false, false, false),
('vendor', 'documents', true, true, false, false, false),
('vendor', 'vendors', true, false, true, false, false),
('vendor', 'tasks', false, false, false, false, false),
('vendor', 'inventory', false, false, false, false, false);

-- =============================================
-- 6. Enhanced Helper Functions
-- =============================================

-- Get user's yacht access with detailed permissions
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  yacht_id UUID,
  role public.app_role,
  access_level TEXT,
  permissions JSONB,
  is_active BOOLEAN
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    yac.yacht_id,
    yac.role,
    yac.access_level,
    yac.permissions,
    yac.is_active
  FROM yacht_access_control yac
  WHERE yac.user_id = p_user_id 
    AND yac.is_active = true
    AND (yac.expires_at IS NULL OR yac.expires_at > NOW());
$$;

-- Check if user has specific permission for module on yacht
CREATE OR REPLACE FUNCTION public.check_yacht_permission(
  p_user_id UUID,
  p_yacht_id UUID,
  p_module_name TEXT,
  p_permission_type TEXT -- 'view', 'add', 'edit', 'approve', 'delete'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role public.app_role;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Get user's role for this yacht
  SELECT role INTO v_role
  FROM yacht_access_control
  WHERE user_id = p_user_id 
    AND yacht_id = p_yacht_id 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check permission in matrix
  SELECT 
    CASE p_permission_type
      WHEN 'view' THEN can_view
      WHEN 'add' THEN can_add
      WHEN 'edit' THEN can_edit
      WHEN 'approve' THEN can_approve
      WHEN 'delete' THEN can_delete
      ELSE false
    END INTO v_has_permission
  FROM role_permissions_matrix
  WHERE role = v_role AND module_name = p_module_name;

  RETURN COALESCE(v_has_permission, false);
END;
$$;

-- Log yacht activity with module tracking
CREATE OR REPLACE FUNCTION public.log_yacht_activity(
  p_yacht_id UUID,
  p_module_name TEXT,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO yacht_activity_log (
    yacht_id,
    user_id,
    module_name,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    p_yacht_id,
    auth.uid(),
    p_module_name,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =============================================
-- 7. Enable RLS and Create Policies
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.yacht_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fleet_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_dashboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions_matrix ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yacht_access_control
CREATE POLICY "Users can view their own yacht access"
  ON public.yacht_access_control FOR SELECT
  USING (
    user_id = auth.uid() OR
    yacht_id IN (
      SELECT yacht_id FROM yacht_access_control 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'captain')
    ) OR
    is_superadmin_or_named(auth.uid())
  );

CREATE POLICY "Owners and managers can manage yacht access"
  ON public.yacht_access_control FOR ALL
  USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access_control 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    ) OR
    is_superadmin_or_named(auth.uid())
  );

-- RLS Policies for fleet_management
CREATE POLICY "Users can view fleets they have access to"
  ON public.fleet_management FOR SELECT
  USING (
    id IN (
      SELECT fleet_id FROM user_fleet_access 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    is_superadmin_or_named(auth.uid())
  );

-- RLS Policies for yacht_activity_log
CREATE POLICY "Users can view activity for their yachts"
  ON public.yacht_activity_log FOR SELECT
  USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access_control 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    is_superadmin_or_named(auth.uid())
  );

CREATE POLICY "System can log all yacht activity"
  ON public.yacht_activity_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for yacht_dashboard_config
CREATE POLICY "Users can manage dashboard config for their yachts"
  ON public.yacht_dashboard_config FOR ALL
  USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access_control 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    is_superadmin_or_named(auth.uid())
  );

-- RLS Policies for role_permissions_matrix (read-only for most users)
CREATE POLICY "Everyone can read permissions matrix"
  ON public.role_permissions_matrix FOR SELECT
  USING (true);

CREATE POLICY "Only superadmins can modify permissions matrix"
  ON public.role_permissions_matrix FOR ALL
  USING (is_superadmin_or_named(auth.uid()));

-- =============================================
-- 8. Create Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_yacht_access_control_user_yacht ON yacht_access_control(user_id, yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_access_control_yacht_role ON yacht_access_control(yacht_id, role);
CREATE INDEX IF NOT EXISTS idx_yacht_activity_log_yacht_timestamp ON yacht_activity_log(yacht_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_activity_log_user_timestamp ON yacht_activity_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_activity_log_module ON yacht_activity_log(module_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_matrix_role_module ON role_permissions_matrix(role, module_name);