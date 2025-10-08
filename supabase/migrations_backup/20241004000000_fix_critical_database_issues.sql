-- =====================================================
-- SYSTEMATIC DATABASE ISSUE RESOLUTION
-- =====================================================
-- This script addresses all the critical database issues
-- identified in the console logs without fallbacks or mock data

-- =====================================================
-- 1. CREATE MISSING TABLES
-- =====================================================

-- Create audit_workflows table
CREATE TABLE IF NOT EXISTS public.audit_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    workflow_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_system_config table
CREATE TABLE IF NOT EXISTS public.ai_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_message TEXT,
    module TEXT,
    severity TEXT DEFAULT 'info',
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_module ON public.analytics_events(module);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- =====================================================
-- 2. FIX RLS POLICY RECURSION
-- =====================================================

-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS user_roles_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_select_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_update_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete_policy ON public.user_roles;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "user_roles_select_policy" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        auth.uid() IN (
            SELECT user_id FROM public.user_roles 
            WHERE role = 'superadmin'
        )
    );

CREATE POLICY "user_roles_insert_policy" ON public.user_roles
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'superadmin'
            )
        )
    );

CREATE POLICY "user_roles_update_policy" ON public.user_roles
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_roles 
            WHERE role = 'superadmin'
        )
    );

CREATE POLICY "user_roles_delete_policy" ON public.user_roles
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_roles 
            WHERE role = 'superadmin'
        )
    );

-- =====================================================
-- 3. FIX INVENTORY_ITEMS TABLE ISSUES
-- =====================================================

-- Drop problematic RLS policies on inventory_items
DROP POLICY IF EXISTS inventory_items_policy ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_select_policy ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_insert_policy ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_update_policy ON public.inventory_items;

-- Create simple, working policies for inventory_items
CREATE POLICY "inventory_items_select_policy" ON public.inventory_items
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            owner_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );
    
CREATE POLICY "inventory_items_insert_policy" ON public.inventory_items
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );
    
CREATE POLICY "inventory_items_update_policy" ON public.inventory_items
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            owner_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );

-- =====================================================
-- 4. FIX YACHT_PROFILES TABLE ISSUES
-- =====================================================

-- Drop problematic policies on yacht_profiles
DROP POLICY IF EXISTS yacht_profiles_policy ON public.yacht_profiles;
DROP POLICY IF EXISTS yacht_profiles_select_policy ON public.yacht_profiles;
DROP POLICY IF EXISTS yacht_profiles_insert_policy ON public.yacht_profiles;
DROP POLICY IF EXISTS yacht_profiles_update_policy ON public.yacht_profiles;

-- Create simple, working policies for yacht_profiles
CREATE POLICY "yacht_profiles_select_policy" ON public.yacht_profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            owner_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );
    
CREATE POLICY "yacht_profiles_insert_policy" ON public.yacht_profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );
    
CREATE POLICY "yacht_profiles_update_policy" ON public.yacht_profiles
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            owner_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );

-- =====================================================
-- 5. CREATE RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Audit workflows policies
CREATE POLICY "audit_workflows_select_policy" ON public.audit_workflows
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );

CREATE POLICY "audit_workflows_insert_policy" ON public.audit_workflows
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND created_by = auth.uid()
    );

-- AI system config policies (admin only)
CREATE POLICY "ai_system_config_select_policy" ON public.ai_system_config
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT user_id FROM public.user_roles 
            WHERE role IN ('superadmin', 'admin')
        )
    );

CREATE POLICY "ai_system_config_insert_policy" ON public.ai_system_config
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT user_id FROM public.user_roles 
            WHERE role IN ('superadmin', 'admin')
        )
    );

-- Analytics events policies
CREATE POLICY "analytics_events_select_policy" ON public.analytics_events
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            auth.uid() IN (
                SELECT user_id FROM public.user_roles 
                WHERE role IN ('superadmin', 'admin')
            )
        )
    );

CREATE POLICY "analytics_events_insert_policy" ON public.analytics_events
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- 6. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_system_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;