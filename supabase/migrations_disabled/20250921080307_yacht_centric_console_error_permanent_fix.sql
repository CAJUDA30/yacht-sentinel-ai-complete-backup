-- =====================================================
-- PERMANENT YACHT-CENTRIC CONSOLE ERROR FIXES
-- Resolves all console errors with yacht-first approach
-- =====================================================

-- 1. Clean up function conflicts (permanent solution)
-- =====================================================
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID);
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID, UUID, BOOLEAN);

-- 2. Create yacht-centric access function (PERMANENT)
-- Users work on ONE specific yacht at a time as primary context
-- =====================================================
CREATE FUNCTION public.get_user_yacht_access_detailed(
  p_user_id UUID DEFAULT auth.uid(),
  p_yacht_id UUID DEFAULT NULL
)
RETURNS TABLE(
  yacht_id UUID,
  role TEXT,
  access_level TEXT,
  permissions JSONB,
  yacht_name TEXT,
  yacht_type TEXT,
  is_primary_yacht BOOLEAN,
  organization_name TEXT,
  current_location TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- YACHT-CENTRIC APPROACH: if specific yacht_id provided, return only that yacht
  IF p_yacht_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      yp.id as yacht_id,
      COALESCE(yac.role::TEXT, CASE WHEN yp.owner_id = p_user_id THEN 'owner' ELSE 'crew' END) as role,
      COALESCE(yac.access_level, CASE WHEN yp.owner_id = p_user_id THEN 'admin' ELSE 'crew' END) as access_level,
      COALESCE(yac.permissions, '{"modules": ["all"]}'::jsonb) as permissions,
      yp.name as yacht_name,
      COALESCE(yp.yacht_type, 'motor_yacht') as yacht_type,
      (yp.owner_id = p_user_id) as is_primary_yacht,
      COALESCE((yp.specifications->'owner_info'->>'organization_name'), 'Individual Owner') as organization_name,
      COALESCE(yp.current_location::TEXT, 'Unknown') as current_location
    FROM yacht_profiles yp
    LEFT JOIN yacht_access_control yac ON yac.yacht_id = yp.id AND yac.user_id = p_user_id AND yac.is_active = true
    WHERE yp.id = p_yacht_id
      AND (
        yp.owner_id = p_user_id 
        OR EXISTS (SELECT 1 FROM crew_members WHERE yacht_id = yp.id AND user_id = p_user_id AND status = 'active')
        OR EXISTS (SELECT 1 FROM yacht_access_control WHERE yacht_id = yp.id AND user_id = p_user_id AND is_active = true)
      );
  ELSE
    -- Return all accessible yachts, OWNER YACHTS FIRST (primary yacht context)
    RETURN QUERY
    SELECT 
      yp.id as yacht_id,
      COALESCE(yac.role::TEXT, CASE WHEN yp.owner_id = p_user_id THEN 'owner' ELSE 'crew' END) as role,
      COALESCE(yac.access_level, CASE WHEN yp.owner_id = p_user_id THEN 'admin' ELSE 'crew' END) as access_level,
      COALESCE(yac.permissions, '{"modules": ["all"]}'::jsonb) as permissions,
      yp.name as yacht_name,
      COALESCE(yp.yacht_type, 'motor_yacht') as yacht_type,
      (yp.owner_id = p_user_id) as is_primary_yacht,
      COALESCE((yp.specifications->'owner_info'->>'organization_name'), 'Individual Owner') as organization_name,
      COALESCE(yp.current_location::TEXT, 'Unknown') as current_location
    FROM yacht_profiles yp
    LEFT JOIN yacht_access_control yac ON yac.yacht_id = yp.id AND yac.user_id = p_user_id AND yac.is_active = true
    WHERE 
      yp.owner_id = p_user_id 
      OR yp.id IN (SELECT yacht_id FROM crew_members WHERE user_id = p_user_id AND status = 'active')
      OR yp.id IN (SELECT yacht_id FROM yacht_access_control WHERE user_id = p_user_id AND is_active = true)
    ORDER BY 
      (yp.owner_id = p_user_id) DESC,  -- YACHT-CENTRIC: Owner yachts first
      yp.created_at DESC;              -- Most recent yachts next
  END IF;
END;
$$;

-- 3. Grant permissions for yacht-centric function
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID, UUID) TO anon;

-- 4. Ensure AI models table exists (for edge function)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_id TEXT NOT NULL,
    capabilities TEXT[] DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    cost_per_token DECIMAL(10,8) DEFAULT 0.0001,
    avg_latency_ms INTEGER DEFAULT 2000,
    success_rate DECIMAL(5,2) DEFAULT 95.0,
    api_secret_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ensure consensus rules table exists (for edge function)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consensus_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT NOT NULL UNIQUE,
    module TEXT,
    action_type TEXT,
    risk_level TEXT DEFAULT 'medium',
    consensus_algorithm TEXT DEFAULT 'majority',
    required_agreement_threshold DECIMAL(3,2) DEFAULT 0.70,
    minimum_models_required INTEGER DEFAULT 1,
    auto_execute_threshold DECIMAL(3,2) DEFAULT 0.85,
    human_approval_threshold DECIMAL(3,2) DEFAULT 0.60,
    model_weights JSONB DEFAULT '{}',
    fallback_models TEXT[] DEFAULT '{}',
    timeout_seconds INTEGER DEFAULT 30,
    min_models INTEGER DEFAULT 1,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.75,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insert default Document AI model (permanent)
-- =====================================================
INSERT INTO public.ai_models (
    provider, 
    model_name, 
    model_id, 
    capabilities, 
    parameters, 
    priority, 
    is_active, 
    api_secret_name
) VALUES (
    'google_document_ai',
    'Document AI Form Parser',
    '4ab65e484eb85038',
    ARRAY['vision', 'form_parsing', 'document_extraction'],
    '{"processor_id": "4ab65e484eb85038", "location": "us", "project_id": "yachtexcel1"}'::jsonb,
    100,
    true,
    'DOCUMENT_AI_API_KEY'
) ON CONFLICT DO NOTHING;

-- 7. Insert default consensus rule for form parsing (permanent)
-- =====================================================
INSERT INTO public.consensus_rules (
    feature_name,
    module,
    action_type,
    risk_level,
    consensus_algorithm,
    minimum_models_required,
    auto_execute_threshold,
    human_approval_threshold,
    model_weights,
    timeout_seconds,
    min_models,
    confidence_threshold,
    is_active
) VALUES (
    'form_parser_extraction',
    'documents',
    'form_parser_extraction',
    'medium',
    'majority',
    1,
    0.75,
    0.60,
    '{"google_document_ai": 1.0}'::jsonb,
    30,
    1,
    0.75,
    true
) ON CONFLICT (feature_name) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

-- 8. Create indexes for performance (permanent)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_active ON public.ai_models (provider, is_active);
CREATE INDEX IF NOT EXISTS idx_consensus_rules_feature ON public.consensus_rules (feature_name, is_active);
CREATE INDEX IF NOT EXISTS idx_consensus_rules_module_action ON public.consensus_rules (module, action_type);

-- 9. Enable RLS (Row Level Security) - permanent
-- =====================================================
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus_rules ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (permanent)
-- =====================================================
DROP POLICY IF EXISTS "Public read access for ai_models" ON public.ai_models;
DROP POLICY IF EXISTS "Service role full access for ai_models" ON public.ai_models;
DROP POLICY IF EXISTS "Public read access for consensus_rules" ON public.consensus_rules;
DROP POLICY IF EXISTS "Service role full access for consensus_rules" ON public.consensus_rules;

-- AI Models policies
CREATE POLICY "Public read access for ai_models" ON public.ai_models
    FOR SELECT USING (true);

CREATE POLICY "Service role full access for ai_models" ON public.ai_models
    FOR ALL USING (auth.role() = 'service_role');

-- Consensus Rules policies  
CREATE POLICY "Public read access for consensus_rules" ON public.consensus_rules
    FOR SELECT USING (true);

CREATE POLICY "Service role full access for consensus_rules" ON public.consensus_rules
    FOR ALL USING (auth.role() = 'service_role');

-- 11. Grant permissions (permanent)
-- =====================================================
GRANT SELECT ON public.ai_models TO authenticated, anon;
GRANT SELECT ON public.consensus_rules TO authenticated, anon;
GRANT ALL ON public.ai_models TO service_role;
GRANT ALL ON public.consensus_rules TO service_role;

-- 12. Insert additional helpful AI models (optional)
-- =====================================================
INSERT INTO public.ai_models (provider, model_name, model_id, capabilities, priority, is_active, api_secret_name)
VALUES 
    ('openai', 'GPT-4o-mini', 'gpt-4o-mini', ARRAY['text', 'reasoning'], 90, true, 'OPENAI_API_KEY'),
    ('gemini', 'Gemini 1.5 Flash', 'gemini-1.5-flash', ARRAY['text', 'vision', 'reasoning'], 85, true, 'GEMINI_API_KEY')
ON CONFLICT DO NOTHING;

-- 13. Insert additional consensus rules (optional)
-- =====================================================
INSERT INTO public.consensus_rules (feature_name, module, action_type, minimum_models_required, is_active)
VALUES 
    ('documents', 'documents', 'general', 1, true),
    ('inventory', 'inventory', 'general', 1, true),
    ('maintenance', 'maintenance', 'general', 1, true)
ON CONFLICT (feature_name) DO NOTHING;

-- Success message
SELECT 'PERMANENT yacht-centric console error fixes applied successfully!' as status;