-- COMPLETE DATABASE SYSTEMATIC FIX
-- This migration addresses all the issues identified in the console:
-- 1. Missing RPC functions (is_superadmin 404 errors)
-- 2. Missing tables (yachts table not found)
-- 3. Incorrect table schemas (ai_providers_unified missing api_endpoint)
-- 4. Permission denied errors for all tables
-- 5. Missing user roles functionality

-- ========================================
-- 1. CREATE MISSING TABLES
-- ========================================

-- Create missing yachts table (referenced in connection tests)
CREATE TABLE IF NOT EXISTS public.yachts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    yacht_type TEXT DEFAULT 'motor_yacht',
    length_overall DECIMAL,
    beam DECIMAL,
    draft DECIMAL,
    year_built INTEGER,
    builder TEXT,
    flag_state TEXT,
    registration_number TEXT,
    imo_number TEXT,
    call_sign TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    specifications JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}'
);

-- ========================================
-- 2. FIX AI_PROVIDERS_UNIFIED TABLE SCHEMA
-- ========================================

-- Add missing columns to ai_providers_unified table
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT;

-- ========================================
-- 3. CREATE ALL MISSING RPC FUNCTIONS
-- ========================================

-- Function to check if a user is a superadmin (with parameter)
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

-- Function to check if current user is superadmin (parameterless)
CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.is_superadmin(auth.uid());
END;
$$;

-- Function to get detailed yacht access for a user
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  yacht_id UUID,
  yacht_name TEXT,
  yacht_type TEXT,
  access_level TEXT,
  permissions JSONB
) AS $$
BEGIN
  -- Use current user if no user_id provided
  IF _user_id IS NULL THEN
    _user_id := auth.uid();
  END IF;
  
  RETURN QUERY
  SELECT 
    yp.id AS yacht_id,
    yp.yacht_name,
    yp.yacht_type,
    CASE 
      WHEN yp.owner_id = _user_id THEN 'owner'
      WHEN ur.role = 'admin' THEN 'admin'
      WHEN ur.role = 'manager' THEN 'manager'
      WHEN ur.role = 'user' THEN 'user'
      ELSE 'viewer'
    END AS access_level,
    CASE 
      WHEN yp.owner_id = _user_id THEN '{"read": true, "write": true, "admin": true, "delete": true}'::JSONB
      WHEN ur.role = 'admin' THEN '{"read": true, "write": true, "admin": true, "delete": false}'::JSONB
      WHEN ur.role = 'manager' THEN '{"read": true, "write": true, "admin": false, "delete": false}'::JSONB
      WHEN ur.role = 'user' THEN '{"read": true, "write": false, "admin": false, "delete": false}'::JSONB
      ELSE '{"read": true, "write": false, "admin": false, "delete": false}'::JSONB
    END AS permissions
  FROM public.yacht_profiles yp
  LEFT JOIN public.user_roles ur ON ur.yacht_id = yp.id AND ur.user_id = _user_id AND ur.is_active = true
  WHERE yp.owner_id = _user_id OR (ur.user_id = _user_id AND ur.is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CREATE COMPREHENSIVE RLS POLICIES
-- ========================================

-- SUPERADMIN POLICIES (Full access to everything)
DROP POLICY IF EXISTS "Superadmin full access yachts" ON public.yachts;
CREATE POLICY "Superadmin full access yachts" ON public.yachts
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin full access user_roles" ON public.user_roles;
CREATE POLICY "Superadmin full access user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid()) OR
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Superadmin full access yacht_profiles" ON public.yacht_profiles;
CREATE POLICY "Superadmin full access yacht_profiles" ON public.yacht_profiles
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid()) OR
    auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "Superadmin full access system_settings" ON public.system_settings;
CREATE POLICY "Superadmin full access system_settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid()) OR
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Superadmin full access inventory_items" ON public.inventory_items;
CREATE POLICY "Superadmin full access inventory_items" ON public.inventory_items  
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM yacht_profiles yp 
      LEFT JOIN user_roles ur ON ur.yacht_id = yp.id
      WHERE yp.id = yacht_id 
      AND (yp.owner_id = auth.uid() OR (ur.user_id = auth.uid() AND ur.is_active = true))
    )
  );

DROP POLICY IF EXISTS "Superadmin full access ai_providers" ON public.ai_providers_unified;
CREATE POLICY "Superadmin full access ai_providers" ON public.ai_providers_unified
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin full access ai_models" ON public.ai_models_unified;
CREATE POLICY "Superadmin full access ai_models" ON public.ai_models_unified
  FOR ALL TO authenticated
  USING (
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'superadmin@yachtexcel.com') OR
    public.is_superadmin(auth.uid())
  );

-- ========================================
-- 6. GRANT PERMISSIONS
-- ========================================

-- Grant table permissions
GRANT ALL ON TABLE public.yachts TO authenticated;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.yacht_profiles TO authenticated;
GRANT ALL ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.inventory_items TO authenticated;
GRANT ALL ON TABLE public.ai_providers_unified TO authenticated;
GRANT ALL ON TABLE public.ai_models_unified TO authenticated;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed TO authenticated;

-- ========================================
-- 7. CREATE SUPERADMIN USER ROLE
-- ========================================

-- Ensure superadmin user role exists
INSERT INTO public.user_roles (user_id, role, yacht_id, is_active, created_by)
VALUES ('a751a50b-740c-4a38-a169-33185128fec5', 'superadmin', NULL, true, 'a751a50b-740c-4a38-a169-33185128fec5')
ON CONFLICT (user_id, yacht_id, role) DO NOTHING;

-- Also create for the other hardcoded UUID
INSERT INTO public.user_roles (user_id, role, yacht_id, is_active, created_by)
VALUES ('6d201176-5be1-45d4-b09f-f70cb4ad38ac', 'superadmin', NULL, true, '6d201176-5be1-45d4-b09f-f70cb4ad38ac')
ON CONFLICT (user_id, yacht_id, role) DO NOTHING;

-- ========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_yacht_id ON user_roles(yacht_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- Yacht profiles indexes
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_status ON yacht_profiles(status);

-- Yachts table indexes
CREATE INDEX IF NOT EXISTS idx_yachts_owner_id ON yachts(owner_id);
CREATE INDEX IF NOT EXISTS idx_yachts_status ON yachts(status);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_yacht_id ON system_settings(yacht_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_yacht_id ON inventory_items(yacht_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);

-- ========================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on all tables
DROP TRIGGER IF EXISTS handle_updated_at ON yachts;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON yachts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON user_roles;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON yacht_profiles;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON yacht_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON system_settings;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON inventory_items;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();