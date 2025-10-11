-- Create ai_models_unified table with proper foreign key relationship to ai_providers_unified

CREATE TABLE IF NOT EXISTS public.ai_models_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
    model_type TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    max_tokens INTEGER,
    input_cost_per_token DECIMAL(10,8),
    output_cost_per_token DECIMAL(10,8),
    config JSONB DEFAULT '{}'::jsonb,
    capabilities JSONB DEFAULT '{}'::jsonb,
    priority INTEGER DEFAULT 0,
    description TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_provider_id ON public.ai_models_unified(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_active ON public.ai_models_unified(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_priority ON public.ai_models_unified(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_models_unified_name ON public.ai_models_unified(name);

-- Enable RLS on ai_models_unified
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_models_unified
DROP POLICY IF EXISTS "Allow superadmin full access to ai_models_unified" ON public.ai_models_unified;
CREATE POLICY "Allow superadmin full access to ai_models_unified"
ON public.ai_models_unified
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
          auth.users.email = 'superadmin@yachtexcel.com' OR
          (auth.users.raw_app_meta_data->>'is_superadmin')::boolean = true OR
          (auth.users.raw_user_meta_data->>'is_superadmin')::boolean = true
        )
    )
);

DROP POLICY IF EXISTS "Allow authenticated users to read ai_models_unified" ON public.ai_models_unified;
CREATE POLICY "Allow authenticated users to read ai_models_unified"
ON public.ai_models_unified
FOR SELECT
TO authenticated
USING (true);

-- Add service role policy for full access
DROP POLICY IF EXISTS "Service role full access to ai_models_unified" ON public.ai_models_unified;
CREATE POLICY "Service role full access to ai_models_unified"
ON public.ai_models_unified
FOR ALL
USING (auth.role() = 'service_role');

-- Insert default models for existing providers
-- Only if no models exist and providers exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.ai_models_unified LIMIT 1) THEN
        -- Insert default models based on existing providers
        INSERT INTO public.ai_models_unified (name, display_name, provider_id, model_type, is_active, max_tokens, priority, description)
        SELECT 
            CASE 
                WHEN p.name ILIKE '%openai%' THEN 'gpt-4o'
                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'claude-3-5-sonnet-20241022'
                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'gemini-1.5-pro-002'
                WHEN p.name ILIKE '%deepseek%' THEN 'deepseek-chat'
                ELSE p.name || '-default'
            END as name,
            CASE 
                WHEN p.name ILIKE '%openai%' THEN 'GPT-4o (Latest)'
                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'Claude 3.5 Sonnet'
                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'Gemini 1.5 Pro'
                WHEN p.name ILIKE '%deepseek%' THEN 'DeepSeek Chat'
                ELSE p.name || ' Default Model'
            END as display_name,
            p.id as provider_id,
            'text' as model_type,
            p.is_active as is_active,
            CASE 
                WHEN p.name ILIKE '%openai%' THEN 128000
                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 200000
                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 2097152
                WHEN p.name ILIKE '%deepseek%' THEN 32768
                ELSE 4096
            END as max_tokens,
            1 as priority,
            CASE 
                WHEN p.name ILIKE '%openai%' THEN 'OpenAI GPT-4o - Latest multimodal model'
                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'Anthropic Claude 3.5 Sonnet - Advanced reasoning'
                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'Google Gemini 1.5 Pro - Large context window'
                WHEN p.name ILIKE '%deepseek%' THEN 'DeepSeek Chat - Efficient reasoning model'
                ELSE p.description
            END as description
        FROM public.ai_providers_unified p
        WHERE p.is_active = true
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Inserted default models for existing providers';
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.ai_models_unified IS 'AI models table with foreign key relationship to ai_providers_unified. Stores model configurations, capabilities, and metadata.';
