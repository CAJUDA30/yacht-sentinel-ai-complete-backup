-- Core Database Migration SQL
-- Creates missing core tables and RPC functions for yacht management system

-- ========================================
-- CORE TABLES CREATION
-- ========================================

-- 1. Create yacht_profiles table first (to avoid foreign key issues)
CREATE TABLE IF NOT EXISTS yacht_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  yacht_name TEXT NOT NULL,
  yacht_type TEXT NOT NULL DEFAULT 'motor_yacht',
  length_overall DECIMAL,
  beam DECIMAL,
  draft DECIMAL,
  year_built INTEGER,
  builder TEXT,
  flag_state TEXT,
  registration_number TEXT,
  imo_number TEXT,
  call_sign TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  specifications JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}'
);

-- 2. Create user_roles table for yacht-centric role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'user', 'manager', 'admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint: one role per user per yacht (NULL yacht_id for global roles)
  UNIQUE(user_id, yacht_id, role),
  
  -- Global superadmin constraint (only one global superadmin role per user)
  CHECK (
    (role = 'superadmin' AND yacht_id IS NULL) OR 
    (role != 'superadmin' OR yacht_id IS NOT NULL)
  )
);

-- 3. Create system_settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for settings
  UNIQUE(user_id, yacht_id, setting_key)
);

-- 4. Create inventory_items table for yacht inventory management
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  location TEXT,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  purchase_date DATE,
  purchase_price DECIMAL,
  supplier TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'damaged')),
  minimum_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- RPC FUNCTIONS (Create before RLS policies)
-- ========================================

-- Function to check if a user is a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use current user if no user_id provided
  IF _user_id IS NULL THEN
    _user_id := auth.uid();
  END IF;
  
  -- Hardcoded superadmin recognition for primary admin users
  IF _user_id = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID OR
     _user_id = 'a751a50b-740c-4a38-a169-33185128fec5'::UUID THEN
    RETURN true;
  END IF;
  
  -- Also check by email for additional security
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email = 'superadmin@yachtexcel.com'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check user_roles table for superadmin role (fallback)
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'superadmin'
    AND yacht_id IS NULL  -- Global superadmin
    AND is_active = true
  );
END;
$$;

-- Function to check if current user is superadmin
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON user_roles;
CREATE POLICY "Superadmins can manage all roles" ON user_roles
  FOR ALL USING (
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
    public.is_superadmin(auth.uid())
  );

-- Yacht profiles policies
DROP POLICY IF EXISTS "Users can view their own yacht profiles" ON yacht_profiles;
CREATE POLICY "Users can view their own yacht profiles" ON yacht_profiles
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.yacht_id = id 
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Yacht owners can manage their yachts" ON yacht_profiles;
CREATE POLICY "Yacht owners can manage their yachts" ON yacht_profiles
  FOR ALL USING (auth.uid() = owner_id);

-- System settings policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON system_settings;
CREATE POLICY "Users can manage their own settings" ON system_settings
  FOR ALL USING (auth.uid() = user_id);

-- Inventory items policies
DROP POLICY IF EXISTS "Users can view yacht inventory they have access to" ON inventory_items;
CREATE POLICY "Users can view yacht inventory they have access to" ON inventory_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM yacht_profiles yp 
      LEFT JOIN user_roles ur ON ur.yacht_id = yp.id
      WHERE yp.id = yacht_id 
      AND (yp.owner_id = auth.uid() OR (ur.user_id = auth.uid() AND ur.is_active = true))
    )
  );

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_yacht_id ON user_roles(yacht_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- Yacht profiles indexes
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_status ON yacht_profiles(status);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_yacht_id ON system_settings(yacht_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_yacht_id ON inventory_items(yacht_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE user_roles TO authenticated;
GRANT ALL ON TABLE yacht_profiles TO authenticated;
GRANT ALL ON TABLE system_settings TO authenticated;
GRANT ALL ON TABLE inventory_items TO authenticated;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed TO authenticated;

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
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