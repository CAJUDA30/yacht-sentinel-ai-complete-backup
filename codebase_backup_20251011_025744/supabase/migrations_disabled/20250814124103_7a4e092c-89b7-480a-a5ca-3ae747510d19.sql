-- Critical Security Fix: Remove Remaining Permissive RLS Policies
-- The previous migration added secure policies but didn't remove the old permissive ones
-- This creates a security bypass since RLS uses OR logic (any allowing policy grants access)

-- Remove the dangerous "Allow all operations" policies that bypass our security
DROP POLICY IF EXISTS "Allow all operations on inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow all operations on scan_events" ON public.scan_events;
DROP POLICY IF EXISTS "Allow all operations on system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Allow all operations on unified_ai_configs" ON public.unified_ai_configs;
DROP POLICY IF EXISTS "Allow all operations on vision_connection_logs" ON public.vision_connection_logs;

-- Also remove any other overly permissive policies that might exist
DROP POLICY IF EXISTS "Public can read inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Public can read scan_events" ON public.scan_events;
DROP POLICY IF EXISTS "Public can read system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Public can read unified_ai_configs" ON public.unified_ai_configs;
DROP POLICY IF EXISTS "Public can read vision_connection_logs" ON public.vision_connection_logs;

-- Verify our secure policies are still in place (these should already exist from previous migration)
-- If they don't exist, create them as fallback

-- Secure inventory_items policies (fallback creation)
DO $$
BEGIN
    -- Check if our secure policies exist, create if missing
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'secure_inventory_items_read') THEN
        CREATE POLICY "secure_inventory_items_read" ON public.inventory_items FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'secure_inventory_items_write') THEN
        CREATE POLICY "secure_inventory_items_write" ON public.inventory_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'secure_inventory_items_modify') THEN
        CREATE POLICY "secure_inventory_items_modify" ON public.inventory_items FOR UPDATE USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'secure_inventory_items_remove') THEN
        CREATE POLICY "secure_inventory_items_remove" ON public.inventory_items FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Secure system_logs policies (fallback creation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_logs' AND policyname = 'secure_system_logs_superadmin_only') THEN
        CREATE POLICY "secure_system_logs_superadmin_only" ON public.system_logs FOR ALL USING (is_superadmin_or_named(auth.uid()));
    END IF;
END $$;

-- Secure scan_events policies (fallback creation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scan_events') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_events' AND policyname = 'secure_scan_events_user_access') THEN
            CREATE POLICY "secure_scan_events_user_access" ON public.scan_events FOR SELECT USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_superadmin_or_named(auth.uid())));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_events' AND policyname = 'secure_scan_events_user_create') THEN
            CREATE POLICY "secure_scan_events_user_create" ON public.scan_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_events' AND policyname = 'secure_scan_events_user_update') THEN
            CREATE POLICY "secure_scan_events_user_update" ON public.scan_events FOR UPDATE USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_superadmin_or_named(auth.uid())));
        END IF;
    END IF;
END $$;

-- Secure unified_ai_configs policies (fallback creation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unified_ai_configs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unified_ai_configs' AND policyname = 'secure_unified_ai_configs_superadmin_only') THEN
            CREATE POLICY "secure_unified_ai_configs_superadmin_only" ON public.unified_ai_configs FOR ALL USING (is_superadmin_or_named(auth.uid()));
        END IF;
    END IF;
END $$;

-- Secure vision_connection_logs policies (fallback creation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vision_connection_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vision_connection_logs' AND policyname = 'secure_vision_logs_superadmin_only') THEN
            CREATE POLICY "secure_vision_logs_superadmin_only" ON public.vision_connection_logs FOR ALL USING (is_superadmin_or_named(auth.uid()));
        END IF;
    END IF;
END $$;