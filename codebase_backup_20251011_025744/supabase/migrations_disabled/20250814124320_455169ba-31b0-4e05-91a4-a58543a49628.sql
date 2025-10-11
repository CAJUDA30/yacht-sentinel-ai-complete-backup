-- Final Security Fix: Secure Remaining Inventory Tables
-- Fix the last 2 inventory-related tables that were missed

-- Enable RLS on inventory_folders and inventory_alerts if they exist
DO $$
BEGIN
    -- Secure inventory_folders table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_folders') THEN
        ALTER TABLE public.inventory_folders ENABLE ROW LEVEL SECURITY;
        
        -- Remove any permissive policies
        DROP POLICY IF EXISTS "Allow all operations on inventory_folders" ON public.inventory_folders;
        DROP POLICY IF EXISTS "Public can read inventory_folders" ON public.inventory_folders;
        
        -- Create secure policies for inventory_folders
        CREATE POLICY "secure_inventory_folders_read" 
        ON public.inventory_folders 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_folders_write" 
        ON public.inventory_folders 
        FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_folders_modify" 
        ON public.inventory_folders 
        FOR UPDATE 
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_folders_remove" 
        ON public.inventory_folders 
        FOR DELETE 
        USING (auth.uid() IS NOT NULL);
    END IF;

    -- Secure inventory_alerts table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_alerts') THEN
        ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
        
        -- Remove any permissive policies
        DROP POLICY IF EXISTS "Allow all operations on inventory_alerts" ON public.inventory_alerts;
        DROP POLICY IF EXISTS "Public can read inventory_alerts" ON public.inventory_alerts;
        
        -- Create secure policies for inventory_alerts
        CREATE POLICY "secure_inventory_alerts_read" 
        ON public.inventory_alerts 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_alerts_write" 
        ON public.inventory_alerts 
        FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_alerts_modify" 
        ON public.inventory_alerts 
        FOR UPDATE 
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "secure_inventory_alerts_remove" 
        ON public.inventory_alerts 
        FOR DELETE 
        USING (auth.uid() IS NOT NULL);
    END IF;
END $$;