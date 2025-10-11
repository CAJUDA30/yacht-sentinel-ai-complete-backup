-- Fix missing relationship between ai_models_unified and ai_providers_unified
-- This script addresses the error: "Could not find a relationship between 'ai_models_unified' and 'ai_providers_unified' in the schema cache"

-- First, check if ai_models_unified table exists and has correct structure
DO $$ 
BEGIN 
    -- Check if ai_models_unified table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_models_unified') THEN
        -- Create ai_models_unified table with proper foreign key relationship
        CREATE TABLE public.ai_models_unified (
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
        CREATE INDEX idx_ai_models_unified_provider_id ON public.ai_models_unified(provider_id);
        CREATE INDEX idx_ai_models_unified_active ON public.ai_models_unified(is_active);
        CREATE INDEX idx_ai_models_unified_priority ON public.ai_models_unified(priority DESC);
        
        RAISE NOTICE 'Created ai_models_unified table with foreign key relationship';
    END IF;
    
    -- Insert some default models for existing providers (only if no models exist)
    IF NOT EXISTS (SELECT FROM public.ai_models_unified LIMIT 1) THEN
        -- Get provider IDs for default models
        INSERT INTO public.ai_models_unified (name, display_name, provider_id, model_type, is_active, max_tokens, priority, description)
        SELECT 
            CASE p.provider_type
                WHEN 'openai' THEN 'gpt-4o'
                WHEN 'anthropic' THEN 'claude-3-5-sonnet-20241022'
                WHEN 'google' THEN 'gemini-1.5-pro-002'
                WHEN 'custom' THEN 'deepseek-chat'
                ELSE 'default-model'
            END as name,
            CASE p.provider_type
                WHEN 'openai' THEN 'GPT-4o (Latest)'
                WHEN 'anthropic' THEN 'Claude 3.5 Sonnet'
                WHEN 'google' THEN 'Gemini 1.5 Pro'
                WHEN 'custom' THEN 'DeepSeek Chat'
                ELSE 'Default Model'
            END as display_name,
            p.id as provider_id,
            'text' as model_type,
            p.is_active as is_active,
            CASE p.provider_type
                WHEN 'openai' THEN 128000
                WHEN 'anthropic' THEN 200000
                WHEN 'google' THEN 2097152
                WHEN 'custom' THEN 32768
                ELSE 4096
            END as max_tokens,
            1 as priority,
            CASE p.provider_type
                WHEN 'openai' THEN 'OpenAI GPT-4o - Latest multimodal model'
                WHEN 'anthropic' THEN 'Anthropic Claude 3.5 Sonnet - Advanced reasoning'
                WHEN 'google' THEN 'Google Gemini 1.5 Pro - Large context window'
                WHEN 'custom' THEN 'DeepSeek Chat - Custom model'
                ELSE 'Default AI model'
            END as description
        FROM public.ai_providers_unified p
        WHERE p.is_active = true;
        
        RAISE NOTICE 'Inserted default models for existing providers';
    END IF;
    
END $$;

-- Enable RLS on ai_models_unified (match ai_providers_unified pattern)
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_models_unified
CREATE POLICY "Allow superadmin full access to ai_models_unified"
ON public.ai_models_unified
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'superadmin@yachtexcel.com'
    )
);

CREATE POLICY "Allow authenticated users to read ai_models_unified"
ON public.ai_models_unified
FOR SELECT
TO authenticated
USING (true);