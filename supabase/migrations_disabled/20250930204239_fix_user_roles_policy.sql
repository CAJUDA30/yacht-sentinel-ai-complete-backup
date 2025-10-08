-- Fix infinite recursion in user_roles policies and create necessary tables/functions

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'superadmin', 'global_superadmin')),
    yacht_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, yacht_id, role)
);

-- Drop existing policies to prevent recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can update any role" ON public.user_roles;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow superadmin full access" ON public.user_roles
FOR ALL
TO authenticated
USING (
    -- Allow if user email is superadmin
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    -- Allow if user has global_superadmin in metadata
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create basic yacht_profiles table
CREATE TABLE IF NOT EXISTS public.yacht_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    yacht_type TEXT,
    length_meters DECIMAL,
    build_year INTEGER,
    flag_country TEXT,
    home_port TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for yacht_profiles
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

-- Simple policies for yacht_profiles
CREATE POLICY "Superadmin full access to yacht_profiles" ON public.yacht_profiles
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

CREATE POLICY "Users can view own yacht_profiles" ON public.yacht_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create basic inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    location TEXT,
    category TEXT,
    yacht_id UUID REFERENCES public.yacht_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Simple policies for inventory_items
CREATE POLICY "Superadmin full access to inventory_items" ON public.inventory_items
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

-- Create basic audit_workflows table
CREATE TABLE IF NOT EXISTS public.audit_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for audit_workflows
ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;

-- Simple policies for audit_workflows
CREATE POLICY "Superadmin full access to audit_workflows" ON public.audit_workflows
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

-- Create basic ai_system_config table
CREATE TABLE IF NOT EXISTS public.ai_system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ai_system_config
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;

-- Simple policies for ai_system_config
CREATE POLICY "Superadmin full access to ai_system_config" ON public.ai_system_config
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superladmin'
);

-- Create basic system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Simple policies for system_settings
CREATE POLICY "Superadmin full access to system_settings" ON public.system_settings
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

-- Create yachts table (referenced in logs)
CREATE TABLE IF NOT EXISTS public.yachts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    yacht_type TEXT,
    length_meters DECIMAL,
    build_year INTEGER,
    flag_country TEXT,
    home_port TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for yachts
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;

-- Simple policies for yachts
CREATE POLICY "Superadmin full access to yachts" ON public.yachts
FOR ALL
TO authenticated
USING (
    auth.email() = 'superadmin@yachtexcel.com'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'global_superadmin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') = 'global_superadmin'
);

-- Create is_global_superadmin function (referenced in logs)
CREATE OR REPLACE FUNCTION public.is_global_superadmin(user_id_param UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    check_user_id UUID;
    user_email TEXT;
    user_metadata JSONB;
    app_metadata JSONB;
BEGIN
    -- Use provided user_id or current user
    check_user_id := COALESCE(user_id_param, auth.uid());
    
    -- Get user info from auth.users
    SELECT email, raw_user_meta_data, raw_app_meta_data
    INTO user_email, user_metadata, app_metadata
    FROM auth.users
    WHERE id = check_user_id;
    
    -- Check if superadmin by email
    IF user_email = 'superadmin@yachtexcel.com' THEN
        RETURN true;
    END IF;
    
    -- Check metadata
    IF (user_metadata ->> 'role') = 'global_superadmin' THEN
        RETURN true;
    END IF;
    
    IF (app_metadata ->> 'role') = 'global_superadmin' THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- Create is_superadmin function (also referenced)
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.is_global_superadmin(user_id_param);
END;
$$;