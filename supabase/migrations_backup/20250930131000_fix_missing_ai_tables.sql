-- Create missing database tables for AI functionality
-- This fixes the 404 errors in the console

-- Create AI providers table
CREATE TABLE IF NOT EXISTS ai_providers_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  endpoint_url TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  capabilities TEXT[] DEFAULT '{}',
  rate_limits JSONB DEFAULT '{}'::jsonb,
  description TEXT
);

-- Create AI models table
CREATE TABLE IF NOT EXISTS ai_models_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  provider_id UUID REFERENCES ai_providers_unified(id),
  model_identifier TEXT NOT NULL,
  model_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_tokens INTEGER,
  cost_per_token DECIMAL(10,8),
  capabilities TEXT[] DEFAULT '{}',
  configuration JSONB DEFAULT '{}'::jsonb
);

-- Create AI health monitoring table
CREATE TABLE IF NOT EXISTS ai_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provider_id UUID REFERENCES ai_providers_unified(id),
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Allow authenticated read ai_providers" ON ai_providers_unified
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated read ai_models" ON ai_models_unified
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated read ai_health" ON ai_health  
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create is_superadmin function
CREATE OR REPLACE FUNCTION is_superadmin(target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  is_admin BOOLEAN := FALSE;
BEGIN
  IF target_user_id IS NULL THEN
    user_id := auth.uid();
  ELSE
    user_id := target_user_id;
  END IF;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  IF user_email = 'superadmin@yachtexcel.com' OR 
     user_email LIKE '%@admin.yacht%' OR
     user_email = 'admin@yacht.com' THEN
    is_admin := TRUE;
  END IF;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin TO anon;

-- Insert default data
INSERT INTO ai_providers_unified (name, provider_type, is_active, description, capabilities) 
VALUES 
('Google Document AI', 'google', true, 'Google Cloud Document AI for yacht document processing', ARRAY['document_processing', 'ocr', 'form_parsing']),
('OpenAI GPT', 'openai', true, 'OpenAI models for text processing and analysis', ARRAY['chat', 'completion', 'analysis']),
('Local AI', 'local', true, 'Local AI processing capabilities', ARRAY['basic_processing'])
ON CONFLICT DO NOTHING;

INSERT INTO ai_models_unified (name, model_identifier, model_type, is_active, priority, provider_id) 
SELECT 
  'Document AI Processor', 
  'projects/338523806048/locations/us/processors/8708cd1d9cd87cc1', 
  'document_processing', 
  true, 
  100,
  id 
FROM ai_providers_unified 
WHERE provider_type = 'google' 
ON CONFLICT DO NOTHING;

INSERT INTO ai_health (provider_id, status, response_time_ms, success_rate) 
SELECT id, 'healthy', 500, 98.50 
FROM ai_providers_unified 
ON CONFLICT DO NOTHING;