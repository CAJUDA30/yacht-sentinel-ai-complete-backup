-- Create missing AI tables for Enhanced AI Provider Setup
-- This fixes the 404 errors for ai_models_unified and ai_providers_unified

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create AI providers table
CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL,
    endpoint_url TEXT,
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    capabilities TEXT[] DEFAULT '{}',
    rate_limits JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    priority INTEGER DEFAULT 0
);

-- Create AI models table
CREATE TABLE IF NOT EXISTS public.ai_models_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    provider_id UUID REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
    model_identifier TEXT NOT NULL,
    model_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    max_tokens INTEGER,
    cost_per_1k_tokens DECIMAL(10,6),
    capabilities TEXT[] DEFAULT '{}',
    config JSONB DEFAULT '{}'::jsonb,
    context_length INTEGER DEFAULT 4096,
    recommended_for TEXT[] DEFAULT '{}'
);

-- Create AI health monitoring table
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

-- Enable Row Level Security
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read AI providers" ON public.ai_providers_unified
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read AI models" ON public.ai_models_unified
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read AI health" ON public.ai_health
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policies for superadmin (full access)
CREATE POLICY "Superadmin full access ai_providers" ON public.ai_providers_unified
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            auth.jwt() ->> 'email' = 'superadmin@yachtexcel.com' OR
            (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
            (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true
        )
    );

CREATE POLICY "Superadmin full access ai_models" ON public.ai_models_unified
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            auth.jwt() ->> 'email' = 'superadmin@yachtexcel.com' OR
            (auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean = true OR
            (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_active ON public.ai_providers_unified(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_provider ON public.ai_models_unified(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_active ON public.ai_models_unified(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_priority ON public.ai_models_unified(priority DESC);

-- Insert default AI providers
INSERT INTO public.ai_providers_unified (name, provider_type, endpoint_url, is_active, description, capabilities, priority) VALUES
('Grok AI', 'grok', 'https://api.x.ai/v1', true, 'X.AI Grok models for advanced reasoning and yacht document processing', ARRAY['text_generation', 'chat_completion', 'mapping', 'data_extraction'], 100),
('OpenAI', 'openai', 'https://api.openai.com/v1', true, 'OpenAI GPT models for general AI tasks', ARRAY['text_generation', 'chat_completion', 'embedding'], 90),
('Anthropic', 'anthropic', 'https://api.anthropic.com', true, 'Anthropic Claude models for advanced reasoning', ARRAY['text_generation', 'chat_completion', 'analysis'], 80)
ON CONFLICT (name) DO NOTHING;

-- Insert default AI models
INSERT INTO public.ai_models_unified (name, provider_id, model_identifier, model_type, is_active, priority, max_tokens, cost_per_1k_tokens, context_length, recommended_for) 
SELECT 
    'Grok 4 Fast Reasoning', 
    p.id, 
    'grok-4-fast-reasoning', 
    'chat', 
    true, 
    100, 
    2000000, 
    0.20, 
    2000000, 
    ARRAY['complex_reasoning', 'document_analysis', 'yacht_mapping']
FROM public.ai_providers_unified p WHERE p.provider_type = 'grok'
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_models_unified (name, provider_id, model_identifier, model_type, is_active, priority, max_tokens, cost_per_1k_tokens, context_length, recommended_for) 
SELECT 
    'Grok 2 Vision (US East)', 
    p.id, 
    'grok-2-vision-1212us-east-1', 
    'vision', 
    true, 
    90, 
    32768, 
    2.00, 
    32768, 
    ARRAY['image_analysis', 'visual_documents', 'multimodal_tasks']
FROM public.ai_providers_unified p WHERE p.provider_type = 'grok'
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_models_unified (name, provider_id, model_identifier, model_type, is_active, priority, max_tokens, cost_per_1k_tokens, context_length, recommended_for) 
SELECT 
    'GPT-4 Turbo', 
    p.id, 
    'gpt-4-turbo-preview', 
    'chat', 
    true, 
    95, 
    4096, 
    0.01, 
    128000, 
    ARRAY['general_purpose', 'code_generation', 'analysis']
FROM public.ai_providers_unified p WHERE p.provider_type = 'openai'
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_models_unified (name, provider_id, model_identifier, model_type, is_active, priority, max_tokens, cost_per_1k_tokens, context_length, recommended_for) 
SELECT 
    'Claude 3 Opus', 
    p.id, 
    'claude-3-opus-20240229', 
    'chat', 
    true, 
    85, 
    4096, 
    0.015, 
    200000, 
    ARRAY['complex_reasoning', 'analysis', 'writing']
FROM public.ai_providers_unified p WHERE p.provider_type = 'anthropic'
ON CONFLICT DO NOTHING;

-- Insert health status for all providers
INSERT INTO public.ai_health (provider_id, status, response_time_ms, success_rate, total_requests)
SELECT id, 'healthy', 500, 98.50, 0 
FROM public.ai_providers_unified 
ON CONFLICT DO NOTHING;