-- Fix critical security vulnerability: Inventory Items and Stock Levels Exposed to Public
-- Enable RLS and create proper policies for inventory_items table

-- Enable RLS on inventory_items table if not already enabled
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies that might exist
DROP POLICY IF EXISTS "Public can read inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete_policy" ON public.inventory_items;

-- Create secure RLS policies for inventory_items - authenticated users only
CREATE POLICY "secure_inventory_items_select" 
ON public.inventory_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_insert" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_update" 
ON public.inventory_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_delete" 
ON public.inventory_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Also secure related inventory tables if they exist and are not properly protected
DO $$
BEGIN
    -- Check if inventory_folders table exists and secure it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_folders') THEN
        ALTER TABLE public.inventory_folders ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view folders" ON public.inventory_folders;
        DROP POLICY IF EXISTS "Public can read folders" ON public.inventory_folders;
        
        CREATE POLICY "secure_inventory_folders_select" ON public.inventory_folders FOR SELECT USING (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_folders_insert" ON public.inventory_folders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_folders_update" ON public.inventory_folders FOR UPDATE USING (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_folders_delete" ON public.inventory_folders FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;

    -- Check if inventory_alerts table exists and secure it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_alerts') THEN
        ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view alerts" ON public.inventory_alerts;
        DROP POLICY IF EXISTS "Public can read alerts" ON public.inventory_alerts;
        
        CREATE POLICY "secure_inventory_alerts_select" ON public.inventory_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_alerts_insert" ON public.inventory_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_alerts_update" ON public.inventory_alerts FOR UPDATE USING (auth.uid() IS NOT NULL);
        CREATE POLICY "secure_inventory_alerts_delete" ON public.inventory_alerts FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
END $$;