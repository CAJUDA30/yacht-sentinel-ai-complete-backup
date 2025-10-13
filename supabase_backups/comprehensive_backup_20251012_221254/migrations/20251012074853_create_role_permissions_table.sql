-- Create role_permissions table for user permission management
-- This table defines what each role can do in the system

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'admin'
    resource TEXT, -- e.g., 'yachts', 'users', 'reports', '*' for all
    action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', '*' for all
    description TEXT,
    conditions JSONB DEFAULT '{}', -- Additional conditions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for role permissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
ON public.role_permissions (role, permission, COALESCE(resource, ''), action);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role, permission, resource, action);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view permissions"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage permissions"
    ON public.role_permissions FOR ALL
    USING (auth.role() = 'service_role');

-- Insert essential role permissions
INSERT INTO public.role_permissions (role, permission, resource, action, description) VALUES
-- Guest permissions (minimal access)
('guest', 'read', 'public_content', 'view', 'View public content'),

-- Viewer permissions (read-only access)
('viewer', 'read', 'yachts', 'view', 'View yacht information'),
('viewer', 'read', 'reports', 'view', 'View reports'),
('viewer', 'read', 'inventory', 'view', 'View inventory items'),
('viewer', 'read', 'documents', 'view', 'View documents'),

-- User permissions (standard user access)
('user', 'read', 'yachts', 'view', 'View yacht information'),
('user', 'write', 'yachts', 'update', 'Update yacht information'),
('user', 'read', 'inventory', 'view', 'View inventory'),
('user', 'write', 'inventory', 'create', 'Create inventory items'),
('user', 'write', 'inventory', 'update', 'Update inventory items'),
('user', 'read', 'reports', 'view', 'View reports'),
('user', 'write', 'reports', 'create', 'Create reports'),
('user', 'read', 'documents', 'view', 'View documents'),
('user', 'write', 'documents', 'upload', 'Upload documents'),
('user', 'read', 'profile', 'view_own', 'View own profile'),
('user', 'write', 'profile', 'update_own', 'Update own profile'),

-- Manager permissions (team management)
('manager', 'read', 'yachts', 'view_all', 'View all yachts'),
('manager', 'write', 'yachts', 'update_all', 'Update all yachts'),
('manager', 'read', 'users', 'view_team', 'View team members'),
('manager', 'write', 'users', 'manage_team', 'Manage team roles'),
('manager', 'read', 'inventory', 'view_all', 'View all inventory'),
('manager', 'write', 'inventory', 'manage_team', 'Manage team inventory'),
('manager', 'read', 'reports', 'view_all', 'View all reports'),
('manager', 'write', 'reports', 'manage_team', 'Manage team reports'),
('manager', 'read', 'analytics', 'view_team', 'View team analytics'),
('manager', 'delete', 'inventory', 'remove_team', 'Remove team inventory items'),

-- Admin permissions (system administration)
('admin', 'read', 'users', 'view_all', 'View all users'),
('admin', 'write', 'users', 'manage_all', 'Manage all users'),
('admin', 'delete', 'users', 'deactivate', 'Deactivate users'),
('admin', 'read', 'system', 'view_config', 'View system configuration'),
('admin', 'write', 'system', 'configure', 'Configure system settings'),
('admin', 'read', 'yachts', 'view_all', 'View all yachts'),
('admin', 'write', 'yachts', 'manage_all', 'Manage all yachts'),
('admin', 'delete', 'yachts', 'delete', 'Delete yachts'),
('admin', 'read', 'analytics', 'view_all', 'View all analytics'),
('admin', 'write', 'roles', 'assign_standard', 'Assign standard roles'),
('admin', 'delete', 'inventory', 'remove', 'Delete inventory items'),
('admin', 'delete', 'documents', 'remove', 'Delete documents'),

-- Superadmin permissions (full system access)
('superadmin', 'admin', '*', '*', 'Full administrative access'),
('superadmin', 'read', '*', '*', 'Full read access to all resources'),
('superadmin', 'write', '*', '*', 'Full write access to all resources'),
('superadmin', 'delete', '*', '*', 'Full delete access to all resources')
ON CONFLICT (role, permission, COALESCE(resource, ''), action) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();