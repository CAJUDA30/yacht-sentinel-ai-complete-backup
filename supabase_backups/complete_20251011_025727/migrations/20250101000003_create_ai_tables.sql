-- Create AI provider tables
CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT,
  api_endpoint TEXT,
  auth_type TEXT DEFAULT 'bearer',
  auth_header_name TEXT DEFAULT 'Authorization',
  api_secret_name TEXT,
  models_endpoint TEXT,
  discovery_url TEXT,
  description TEXT,
  capabilities JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.llm_provider_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS public.ai_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('connected', 'error', 'unknown')),
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider_id)
);

CREATE TABLE IF NOT EXISTS public.ai_provider_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  latency_ms INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_name ON public.ai_providers_unified(name);
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_active ON public.ai_providers_unified(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_provider_models_provider_id ON public.llm_provider_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_health_provider_id ON public.ai_health(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_health_status ON public.ai_health(status);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_provider_id ON public.ai_provider_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_created_at ON public.ai_provider_logs(created_at);

-- Enable RLS
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_providers_unified
CREATE POLICY "Enable all access for service_role" ON public.ai_providers_unified
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.ai_providers_unified
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.ai_providers_unified
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

-- Create policies for llm_provider_models
CREATE POLICY "Enable all access for service_role" ON public.llm_provider_models
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.llm_provider_models
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.llm_provider_models
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

-- Create policies for ai_health
CREATE POLICY "Enable all access for service_role" ON public.ai_health
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.ai_health
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.ai_health
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

-- Create policies for ai_provider_logs
CREATE POLICY "Enable all access for service_role" ON public.ai_provider_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.ai_provider_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.ai_provider_logs
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_ai_providers_unified_updated_at ON public.ai_providers_unified;
CREATE TRIGGER trigger_ai_providers_unified_updated_at
  BEFORE UPDATE ON public.ai_providers_unified
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default AI providers
INSERT INTO public.ai_providers_unified (name, base_url, api_endpoint, auth_type, models_endpoint, description) VALUES
  ('OpenAI', 'https://api.openai.com', 'https://api.openai.com/v1', 'bearer', 'https://api.openai.com/v1/models', 'OpenAI GPT models'),
  ('Google Gemini', 'https://generativelanguage.googleapis.com', 'https://generativelanguage.googleapis.com/v1beta', 'bearer', NULL, 'Google Gemini AI models'),
  ('DeepSeek', 'https://api.deepseek.com', 'https://api.deepseek.com/v1', 'bearer', 'https://api.deepseek.com/v1/models', 'DeepSeek AI models')
ON CONFLICT (name) DO NOTHING;