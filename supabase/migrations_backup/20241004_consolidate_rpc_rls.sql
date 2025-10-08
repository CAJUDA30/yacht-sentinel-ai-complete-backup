-- SYSTEMATIC DATABASE CONSOLIDATION
-- Following "real data only" philosophy - no fallbacks, only actual database objects
-- This migration consolidates all required RPC functions and RLS policies

-- Enable RLS globally
ALTER DATABASE postgres SET row_security = on;

-- 1. CORE AUTHENTICATION FUNCTIONS
-- Create is_superadmin RPC function that works with actual user authentication
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    user_email TEXT;
    is_super BOOLEAN DEFAULT FALSE;
BEGIN
    -- Use provided user_id or get current user
    target_user_id := COALESCE(user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- Check if user is superadmin by email or metadata
    SELECT COALESCE(
        (raw_user_meta_data->>'is_superadmin')::boolean,
        (raw_app_meta_data->>'is_superadmin')::boolean,
        email = 'superadmin@yachtexcel.com',
        FALSE
    ) INTO is_super
    FROM auth.users 
    WHERE id = target_user_id;
    
    RETURN COALESCE(is_super, FALSE);
END;
$$;

-- Create parameterless version for current user
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.is_superadmin(auth.uid());
END;
$$;

-- 2. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- System settings RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can do everything
CREATE POLICY "superadmin_all_system_settings" ON public.system_settings
    FOR ALL USING (public.is_superadmin());

-- Policy: Authenticated users can read public settings
CREATE POLICY "authenticated_read_public_system_settings" ON public.system_settings
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = TRUE);

-- 3. AUDIT WORKFLOWS TABLE
CREATE TABLE IF NOT EXISTS public.audit_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    workflow_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    schedule_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Audit workflows RLS  
ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can do everything
CREATE POLICY "superadmin_all_audit_workflows" ON public.audit_workflows
    FOR ALL USING (public.is_superadmin());

-- Policy: Authenticated users can read active workflows
CREATE POLICY "authenticated_read_active_audit_workflows" ON public.audit_workflows
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- 4. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    location TEXT,
    yacht_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Inventory items RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can do everything
CREATE POLICY "superadmin_all_inventory_items" ON public.inventory_items
    FOR ALL USING (public.is_superadmin());

-- Policy: Users can access items for their yachts
CREATE POLICY "users_own_yacht_inventory_items" ON public.inventory_items
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            yacht_id IN (
                SELECT id FROM public.yacht_profiles 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- 5. AI SYSTEM CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.ai_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- AI system config RLS
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmins can access AI system config
CREATE POLICY "superadmin_only_ai_system_config" ON public.ai_system_config
    FOR ALL USING (public.is_superadmin());

-- 6. YACHTS TABLE (Basic structure)
CREATE TABLE IF NOT EXISTS public.yachts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    length_meters DECIMAL(8,2),
    year_built INTEGER,
    flag_state TEXT,
    owner_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yachts RLS
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can do everything
CREATE POLICY "superadmin_all_yachts" ON public.yachts
    FOR ALL USING (public.is_superadmin());

-- Policy: Users can access their own yachts
CREATE POLICY "users_own_yachts" ON public.yachts
    FOR ALL USING (auth.role() = 'authenticated' AND owner_id = auth.uid());

-- 7. YACHT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.yacht_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id),
    profile_name TEXT NOT NULL,
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yacht profiles RLS
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can do everything
CREATE POLICY "superadmin_all_yacht_profiles" ON public.yacht_profiles
    FOR ALL USING (public.is_superadmin());

-- Policy: Users can access their own yacht profiles
CREATE POLICY "users_own_yacht_profiles" ON public.yacht_profiles
    FOR ALL USING (auth.role() = 'authenticated' AND owner_id = auth.uid());

-- 8. ENSURE AI_PROVIDERS_UNIFIED EXISTS WITH PROPER RLS
-- This table should already exist but ensure proper RLS
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_providers_unified') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist to avoid conflicts
        DROP POLICY IF EXISTS "superadmin_all_ai_providers_unified" ON public.ai_providers_unified;
        DROP POLICY IF EXISTS "authenticated_read_ai_providers_unified" ON public.ai_providers_unified;
        
        -- Policy: Superadmins can do everything
        CREATE POLICY "superadmin_all_ai_providers_unified" ON public.ai_providers_unified
            FOR ALL USING (public.is_superadmin());
            
        -- Policy: Authenticated users can read active providers
        CREATE POLICY "authenticated_read_ai_providers_unified" ON public.ai_providers_unified
            FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);
    END IF;
END
$$;

-- 9. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'system_settings',
        'audit_workflows', 
        'inventory_items',
        'ai_system_config',
        'yachts',
        'yacht_profiles'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        -- Drop trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON public.%I', table_name);
        
        -- Create trigger
        EXECUTE format('
            CREATE TRIGGER handle_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.handle_updated_at()
        ', table_name);
    END LOOP;
END
$$;

-- 10. INSERT DEFAULT DATA (Real data only, no mock data)
-- System settings for core functionality
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public) VALUES
    ('app_name', '"Yacht Sentinel AI"', 'Application name', TRUE),
    ('app_version', '"1.0.0"', 'Application version', TRUE),
    ('maintenance_mode', 'false', 'Maintenance mode flag', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- Audit integration config
INSERT INTO public.ai_system_config (config_key, config_value, description) VALUES
    ('audit_integration', '{"enabled": false, "providers": []}', 'Audit integration configuration')
ON CONFLICT (config_key) DO NOTHING;

-- 11. GRANT PROPER PERMISSIONS
-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon role has minimal access
GRANT USAGE ON SCHEMA public TO anon;

-- 12. REFRESH SCHEMA CACHE
-- Force PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification - log completion
DO $$
BEGIN
    RAISE NOTICE 'Database consolidation completed successfully';
    RAISE NOTICE 'Tables created/verified: system_settings, audit_workflows, inventory_items, ai_system_config, yachts, yacht_profiles';
    RAISE NOTICE 'RPC functions: is_superadmin (with and without parameters)';  
    RAISE NOTICE 'RLS policies applied with superadmin and user-specific access';
    RAISE NOTICE 'Following real data only philosophy - no mock data or fallbacks';
END
$$;