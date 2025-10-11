-- Yacht-centric user roles system migration
-- This migration ensures all data is yacht-specific and GDPR compliant

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create yachts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.yachts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    owner_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create yacht_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.yacht_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(yacht_id)
);

-- Create user_roles table with yacht-centric design
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'crew_member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, yacht_id, role),
    CHECK (
        (role = 'global_superadmin' AND yacht_id IS NULL) OR
        (role != 'global_superadmin' AND yacht_id IS NOT NULL)
    )
);

-- Create crew_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    position VARCHAR(100),
    certifications JSONB DEFAULT '[]',
    emergency_contact JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create other essential tables if they don't exist
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(yacht_id, config_key)
);

CREATE TABLE IF NOT EXISTS public.audit_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(yacht_id, setting_key)
);

-- Enable Row Level Security on yacht-specific tables
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yacht-specific access
-- Global superadmins can access everything, others only their yacht

-- Yachts policies
DROP POLICY IF EXISTS "Users can view their yacht" ON public.yachts;
CREATE POLICY "Users can view their yacht" ON public.yachts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = yachts.id)
        )
    );

-- Yacht profiles policies
DROP POLICY IF EXISTS "Users can access their yacht profile" ON public.yacht_profiles;
CREATE POLICY "Users can access their yacht profile" ON public.yacht_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = yacht_profiles.yacht_id)
        )
    );

-- User roles policies
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles" ON public.user_roles
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'global_superadmin'
        )
    );

-- Crew members policies
DROP POLICY IF EXISTS "Users can access crew of their yacht" ON public.crew_members;
CREATE POLICY "Users can access crew of their yacht" ON public.crew_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = crew_members.yacht_id)
        )
    );

-- Inventory items policies
DROP POLICY IF EXISTS "Users can access inventory of their yacht" ON public.inventory_items;
CREATE POLICY "Users can access inventory of their yacht" ON public.inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = inventory_items.yacht_id)
        )
    );

-- Certificates policies
DROP POLICY IF EXISTS "Users can access certificates of their yacht" ON public.certificates;
CREATE POLICY "Users can access certificates of their yacht" ON public.certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = certificates.yacht_id)
        )
    );

-- AI system config policies
DROP POLICY IF EXISTS "Users can access AI config of their yacht" ON public.ai_system_config;
CREATE POLICY "Users can access AI config of their yacht" ON public.ai_system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = ai_system_config.yacht_id)
        )
    );

-- Audit workflows policies
DROP POLICY IF EXISTS "Users can access audit workflows of their yacht" ON public.audit_workflows;
CREATE POLICY "Users can access audit workflows of their yacht" ON public.audit_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = audit_workflows.yacht_id)
        )
    );

-- System settings policies
DROP POLICY IF EXISTS "Users can access system settings of their yacht" ON public.system_settings;
CREATE POLICY "Users can access system settings of their yacht" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND (ur.role = 'global_superadmin' OR ur.yacht_id = system_settings.yacht_id)
        )
    );

-- Create yacht-aware RPC functions
CREATE OR REPLACE FUNCTION public.get_user_yacht_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(yacht_id UUID, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.yacht_id, ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_user_to_yacht(
    target_user_id UUID,
    target_yacht_id UUID,
    user_role TEXT DEFAULT 'crew_member'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is global superadmin
    SELECT role INTO current_user_role
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'global_superadmin';
    
    IF current_user_role IS NULL THEN
        RAISE EXCEPTION 'Only global superadmins can assign users to yachts';
    END IF;
    
    -- Insert or update user role
    INSERT INTO public.user_roles (user_id, yacht_id, role)
    VALUES (target_user_id, target_yacht_id, user_role)
    ON CONFLICT (user_id, yacht_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_global_superadmin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = user_uuid AND role = 'global_superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
    table_name TEXT;
    trigger_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = t.table_name 
            AND c.column_name = 'updated_at'
        )
    LOOP
        trigger_name := 'on_updated_at_' || table_name;
        
        -- Drop trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, table_name);
        
        -- Create new trigger
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
            trigger_name, table_name
        );
    END LOOP;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.yachts TO anon, authenticated;
GRANT SELECT ON public.yacht_profiles TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.crew_members TO authenticated;
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.certificates TO authenticated;
GRANT ALL ON public.ai_system_config TO authenticated;
GRANT ALL ON public.audit_workflows TO authenticated;
GRANT ALL ON public.system_settings TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_yacht_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_to_yacht TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_superadmin TO authenticated;