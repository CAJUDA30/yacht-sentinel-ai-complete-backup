-- Create missing tables: inventory_items, audit_workflows, ai_system_config
-- These tables are referenced by the application but don't exist in the database

-- 1. INVENTORY ITEMS TABLE
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

-- RLS Policies for inventory_items
CREATE POLICY "Service role full access"
ON public.inventory_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated write access"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete access"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_yacht_id ON public.inventory_items(yacht_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON public.inventory_items(created_at DESC);

-- 2. AUDIT WORKFLOWS TABLE
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

-- RLS Policies for audit_workflows
CREATE POLICY "Service role full access"
ON public.audit_workflows
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.audit_workflows
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated write access"
ON public.audit_workflows
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.audit_workflows
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete access"
ON public.audit_workflows
FOR DELETE
TO authenticated
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_workflows_active ON public.audit_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_created_at ON public.audit_workflows(created_at DESC);

-- 3. AI SYSTEM CONFIG TABLE
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

-- RLS Policies for ai_system_config  
CREATE POLICY "Service role full access"
ON public.ai_system_config
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.ai_system_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated write access"
ON public.ai_system_config
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update access"
ON public.ai_system_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete access"
ON public.ai_system_config
FOR DELETE
TO authenticated
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_system_config_key ON public.ai_system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_ai_system_config_sensitive ON public.ai_system_config(is_sensitive);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER trigger_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_audit_workflows_updated_at
    BEFORE UPDATE ON public.audit_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_ai_system_config_updated_at
    BEFORE UPDATE ON public.ai_system_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.inventory_items IS 'Yacht inventory management - tracks items, quantities, and values';
COMMENT ON TABLE public.audit_workflows IS 'Audit workflow configurations for automated compliance checks';
COMMENT ON TABLE public.ai_system_config IS 'AI system configuration settings with sensitive data support';
