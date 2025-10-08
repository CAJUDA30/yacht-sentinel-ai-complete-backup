-- Create unified AI configuration tables for multi-model support with Yachtie as primary model

-- AI providers table for multi-model support
CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('yachtie', 'openai', 'gemini', 'anthropic', 'custom')),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  capabilities JSONB DEFAULT '[]',
  supported_languages JSONB DEFAULT '["en"]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI models configuration
CREATE TABLE IF NOT EXISTS public.ai_models_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers_unified(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('text', 'vision', 'ocr', 'translation', 'multimodal')),
  priority INTEGER DEFAULT 50,
  parameters JSONB DEFAULT '{}',
  rate_limits JSONB DEFAULT '{"per_minute": 60, "per_hour": 1000}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Language configurations for dynamic language support
CREATE TABLE IF NOT EXISTS public.ai_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL UNIQUE,
  language_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  script_direction TEXT DEFAULT 'ltr' CHECK (script_direction IN ('ltr', 'rtl')),
  locale_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI credentials (encrypted storage)
CREATE TABLE IF NOT EXISTS public.ai_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers_unified(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('api_key', 'bearer_token', 'oauth', 'service_account')),
  encrypted_value TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default Yachtie configuration
INSERT INTO public.ai_providers_unified (name, base_url, provider_type, is_primary, capabilities, supported_languages, config) VALUES 
('Yachtie Multi-Language AI', 'https://api.yachtie.ai/v1', 'yachtie', TRUE, 
 '["text", "ocr", "translation", "sentiment", "multimodal"]',
 '["en", "fr", "es", "de", "it", "pt", "nl", "sv", "no", "da"]',
 '{"timeout": 30000, "max_retries": 3, "default_temperature": 0.2}'
);

-- Insert default Yachtie models
INSERT INTO public.ai_models_unified (provider_id, model_id, model_name, model_type, parameters)
SELECT 
  p.id,
  'yachtie-multi-v1',
  'Yachtie Multi-Language Core',
  'text',
  '{"temperature": 0.2, "max_tokens": 4096}'
FROM ai_providers_unified p WHERE p.provider_type = 'yachtie';

INSERT INTO public.ai_models_unified (provider_id, model_id, model_name, model_type, parameters)
SELECT 
  p.id,
  'yachtie-ocr-specialized',
  'Yachtie OCR Specialist',
  'ocr',
  '{"temperature": 0.1, "confidence_threshold": 0.8}'
FROM ai_providers_unified p WHERE p.provider_type = 'yachtie';

INSERT INTO public.ai_models_unified (provider_id, model_id, model_name, model_type, parameters)
SELECT 
  p.id,
  'yachtie-translate',
  'Yachtie Translation Engine',
  'translation',
  '{"preserve_formatting": true, "detect_source": true}'
FROM ai_providers_unified p WHERE p.provider_type = 'yachtie';

-- Insert default languages
INSERT INTO public.ai_languages (language_code, language_name) VALUES
('en', 'English'),
('fr', 'Français'),
('es', 'Español'),
('de', 'Deutsch'),
('it', 'Italiano'),
('pt', 'Português'),
('nl', 'Nederlands'),
('sv', 'Svenska'),
('no', 'Norsk'),
('da', 'Dansk');

-- Enable RLS
ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for superadmin access
CREATE POLICY "Superadmins can manage AI providers" ON public.ai_providers_unified
FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI models" ON public.ai_models_unified
FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Everyone can view AI languages" ON public.ai_languages
FOR SELECT USING (TRUE);

CREATE POLICY "Superadmins can manage AI languages" ON public.ai_languages
FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI credentials" ON public.ai_credentials
FOR ALL USING (is_superadmin_or_named(auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_providers_unified_updated_at 
BEFORE UPDATE ON public.ai_providers_unified 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_unified_updated_at 
BEFORE UPDATE ON public.ai_models_unified 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_languages_updated_at 
BEFORE UPDATE ON public.ai_languages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_credentials_updated_at 
BEFORE UPDATE ON public.ai_credentials 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();