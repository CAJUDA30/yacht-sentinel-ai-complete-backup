-- Create AI providers table
CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL DEFAULT 'openai',
    base_url TEXT,
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    rate_limit_per_minute INTEGER DEFAULT 60,
    capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    config JSONB DEFAULT '{}'::jsonb,
    auth_method TEXT DEFAULT 'api_key',
    supported_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT
);

-- Create AI models table
CREATE TABLE IF NOT EXISTS public.ai_models_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    provider_id UUID REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_type TEXT NOT NULL DEFAULT 'chat',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    max_context_length INTEGER DEFAULT 4096,
    parameters JSONB DEFAULT '{}'::jsonb,
    rate_limits JSONB DEFAULT '{}'::jsonb,
    specialization TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create AI health table
CREATE TABLE IF NOT EXISTS public.ai_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    provider_id UUID REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'healthy',
    response_time_ms INTEGER DEFAULT 0,
    last_check_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow authenticated read ai_providers" ON public.ai_providers_unified;
CREATE POLICY "Allow authenticated read ai_providers" ON public.ai_providers_unified
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated read ai_models" ON public.ai_models_unified;
CREATE POLICY "Allow authenticated read ai_models" ON public.ai_models_unified
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated read ai_health" ON public.ai_health;
CREATE POLICY "Allow authenticated read ai_health" ON public.ai_health
    FOR SELECT USING (true);

-- Insert default providers
INSERT INTO public.ai_providers_unified (name, provider_type, is_active, capabilities, description) 
VALUES 
    ('OpenAI', 'openai', true, ARRAY['chat', 'completion', 'analysis'], 'OpenAI GPT models for intelligent processing'),
    ('Anthropic', 'anthropic', true, ARRAY['chat', 'analysis', 'reasoning'], 'Anthropic Claude models for advanced reasoning'),
    ('Local AI', 'local', true, ARRAY['basic_processing'], 'Local AI processing capabilities')
ON CONFLICT (name) DO NOTHING;

-- Insert default models
INSERT INTO public.ai_models_unified (provider_id, name, model_name, model_id, model_type, is_active, max_context_length)
SELECT 
    p.id,
    CASE 
        WHEN p.name = 'OpenAI' THEN 'GPT-4'
        WHEN p.name = 'Anthropic' THEN 'Claude 3 Sonnet'  
        WHEN p.name = 'Local AI' THEN 'Local Model'
    END,
    CASE 
        WHEN p.name = 'OpenAI' THEN 'gpt-4'
        WHEN p.name = 'Anthropic' THEN 'claude-3-sonnet'
        WHEN p.name = 'Local AI' THEN 'local-model'
    END,
    CASE 
        WHEN p.name = 'OpenAI' THEN 'gpt-4'
        WHEN p.name = 'Anthropic' THEN 'claude-3-sonnet-20240229'
        WHEN p.name = 'Local AI' THEN 'local-model-v1'
    END,
    CASE 
        WHEN p.name = 'OpenAI' THEN 'chat'
        WHEN p.name = 'Anthropic' THEN 'chat'
        WHEN p.name = 'Local AI' THEN 'local'
    END,
    true,
    CASE 
        WHEN p.name = 'OpenAI' THEN 8192
        WHEN p.name = 'Anthropic' THEN 200000
        WHEN p.name = 'Local AI' THEN 4096
    END
FROM public.ai_providers_unified p
ON CONFLICT DO NOTHING;

-- Insert health status
INSERT INTO public.ai_health (provider_id, status, response_time_ms, success_rate, total_requests, failed_requests)
SELECT 
    p.id,
    'healthy',
    (200 + (RANDOM() * 800)::INTEGER),
    (95 + (RANDOM() * 5))::DECIMAL(5,2),
    (RANDOM() * 10000)::INTEGER,
    (RANDOM() * 100)::INTEGER
FROM public.ai_providers_unified p
ON CONFLICT (provider_id) DO NOTHING;