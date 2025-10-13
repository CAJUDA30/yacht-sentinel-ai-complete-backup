-- Unify all RLS policies across all tables to prevent recursion and ensure consistency
-- Standard Pattern:
-- 1. Service role: Full unrestricted access
-- 2. Authenticated read: All authenticated users can read
-- 3. Authenticated write/update/delete: Based on ownership or superadmin
-- 4. Superadmin: Full access using direct auth.users email check (NO user_roles recursion)

-- ==========================================
-- 1. FIX AI_HEALTH TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.ai_health;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ai_health;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.ai_health;

CREATE POLICY "Service role full access"
ON public.ai_health FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.ai_health FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.ai_health FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 2. FIX AI_PROVIDER_LOGS TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.ai_provider_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ai_provider_logs;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.ai_provider_logs;

CREATE POLICY "Service role full access"
ON public.ai_provider_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.ai_provider_logs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.ai_provider_logs FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 3. FIX ANALYTICS_EVENTS TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.analytics_events;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.analytics_events;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.analytics_events;

CREATE POLICY "Service role full access"
ON public.analytics_events FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.analytics_events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.analytics_events FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 4. FIX EDGE_FUNCTION_HEALTH TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.edge_function_health;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.edge_function_health;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.edge_function_health;

CREATE POLICY "Service role full access"
ON public.edge_function_health FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.edge_function_health FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.edge_function_health FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 5. FIX EDGE_FUNCTION_SETTINGS TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.edge_function_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.edge_function_settings;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.edge_function_settings;

CREATE POLICY "Service role full access"
ON public.edge_function_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.edge_function_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.edge_function_settings FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 6. FIX EVENT_BUS TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.event_bus;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.event_bus;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.event_bus;

CREATE POLICY "Service role full access"
ON public.event_bus FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.event_bus FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.event_bus FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 7. FIX LLM_PROVIDER_MODELS TABLE
-- ==========================================
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.llm_provider_models;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.llm_provider_models;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.llm_provider_models;

CREATE POLICY "Service role full access"
ON public.llm_provider_models FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.llm_provider_models FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.llm_provider_models FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 8. ADD MISSING POLICIES TO UNIFIED_AI_CONFIGS
-- ==========================================
DROP POLICY IF EXISTS "Service role full access" ON public.unified_ai_configs;

CREATE POLICY "Service role full access"
ON public.unified_ai_configs FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.unified_ai_configs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Superadmin full access"
ON public.unified_ai_configs FOR ALL TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- ==========================================
-- 9. VERIFY USER_ROLES POLICIES (ALREADY FIXED)
-- ==========================================
-- Remove duplicate policy if exists
DROP POLICY IF EXISTS "Enable read access for own roles" ON public.user_roles;

-- user_roles already has correct policies from previous migration:
-- - Service role full access
-- - Users read own roles
-- - Superadmin full access

-- ==========================================
-- COMMENTS
-- ==========================================
COMMENT ON POLICY "Service role full access" ON public.ai_health IS 'Full unrestricted access for service role (migrations, maintenance)';
COMMENT ON POLICY "Authenticated read access" ON public.ai_health IS 'All authenticated users can read AI health data';
COMMENT ON POLICY "Superadmin full access" ON public.ai_health IS 'Superadmin has full access using direct email check (no recursion)';

COMMENT ON POLICY "Service role full access" ON public.ai_provider_logs IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.ai_provider_logs IS 'All authenticated users can read logs';
COMMENT ON POLICY "Superadmin full access" ON public.ai_provider_logs IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.analytics_events IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.analytics_events IS 'All authenticated users can read analytics';
COMMENT ON POLICY "Superadmin full access" ON public.analytics_events IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.edge_function_health IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.edge_function_health IS 'All authenticated users can read health data';
COMMENT ON POLICY "Superadmin full access" ON public.edge_function_health IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.edge_function_settings IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.edge_function_settings IS 'All authenticated users can read settings';
COMMENT ON POLICY "Superadmin full access" ON public.edge_function_settings IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.event_bus IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.event_bus IS 'All authenticated users can read events';
COMMENT ON POLICY "Superadmin full access" ON public.event_bus IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.llm_provider_models IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.llm_provider_models IS 'All authenticated users can read models';
COMMENT ON POLICY "Superadmin full access" ON public.llm_provider_models IS 'Superadmin has full access using direct email check';

COMMENT ON POLICY "Service role full access" ON public.unified_ai_configs IS 'Full unrestricted access for service role';
COMMENT ON POLICY "Authenticated read access" ON public.unified_ai_configs IS 'All authenticated users can read configs';
COMMENT ON POLICY "Superadmin full access" ON public.unified_ai_configs IS 'Superadmin has full access using direct email check';
