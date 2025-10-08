-- Create AI providers table for dynamic provider management
CREATE TABLE public.ai_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'bearer', -- bearer, api_key, header
  auth_header_name TEXT DEFAULT 'Authorization',
  models_endpoint TEXT NOT NULL, -- relative path to get models list
  request_format JSONB NOT NULL DEFAULT '{}', -- template for API requests
  response_format JSONB NOT NULL DEFAULT '{}', -- how to parse responses
  supported_capabilities JSONB NOT NULL DEFAULT '[]', -- text, vision, audio, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to ai_models table
ALTER TABLE public.ai_models 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Create ai_performance_logs table for tracking model performance
CREATE TABLE public.ai_performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES public.ai_models(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  confidence_score NUMERIC(3, 2),
  user_feedback TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on ai_providers" ON public.ai_providers FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_performance_logs" ON public.ai_performance_logs FOR ALL USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default providers
INSERT INTO public.ai_providers (name, base_url, models_endpoint, request_format, response_format, supported_capabilities) VALUES
('OpenAI', 'https://api.openai.com', '/v1/models', 
 '{"headers": {"Authorization": "Bearer {{api_key}}"}, "method": "GET"}',
 '{"models_path": "data", "id_field": "id", "name_field": "id"}',
 '["text", "vision", "audio"]'),
('Anthropic', 'https://api.anthropic.com', '/v1/models',
 '{"headers": {"x-api-key": "{{api_key}}"}, "method": "GET"}',
 '{"models_path": "data", "id_field": "id", "name_field": "display_name"}',
 '["text", "vision"]'),
('Google Gemini', 'https://generativelanguage.googleapis.com', '/v1beta/models',
 '{"headers": {"x-goog-api-key": "{{api_key}}"}, "method": "GET"}',
 '{"models_path": "models", "id_field": "name", "name_field": "displayName"}',
 '["text", "vision"]'),
('xAI Grok', 'https://api.x.ai', '/v1/models',
 '{"headers": {"Authorization": "Bearer {{api_key}}"}, "method": "GET"}',
 '{"models_path": "data", "id_field": "id", "name_field": "id"}',
 '["text"]'),
('DeepSeek', 'https://api.deepseek.com', '/v1/models',
 '{"headers": {"Authorization": "Bearer {{api_key}}"}, "method": "GET"}',
 '{"models_path": "data", "id_field": "id", "name_field": "id"}',
 '["text"]');