import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute the missing tables SQL
    const { data, error } = await supabaseClient.rpc('exec', {
      sql: `
-- Create AI providers table
CREATE TABLE IF NOT EXISTS ai_providers_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
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
  priority INTEGER DEFAULT 0
);

-- Create AI health table
CREATE TABLE IF NOT EXISTS ai_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provider_id UUID REFERENCES ai_providers_unified(id),
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  success_rate DECIMAL(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE ai_providers_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_health ENABLE ROW LEVEL SECURITY;

-- Create policies
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
  
  IF user_email = 'superadmin@yachtexcel.com' THEN
    is_admin := TRUE;
  END IF;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin TO anon;

-- Insert default data
INSERT INTO ai_providers_unified (name, provider_type, is_active, description) 
VALUES 
('Google Document AI', 'google', true, 'Google Cloud Document AI'),
('OpenAI GPT', 'openai', true, 'OpenAI models'),
('Local AI', 'local', true, 'Local AI processing')
ON CONFLICT DO NOTHING;
      `
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Missing AI tables created successfully',
      data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})