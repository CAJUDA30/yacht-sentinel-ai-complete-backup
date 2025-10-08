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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('🚀 Auto-setup AI tables - Starting systematic solution...')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Check if table exists first
    console.log('🔍 Checking if ai_providers_unified table exists...')
    const { data: existingData, error: checkError } = await supabase
      .from('ai_providers_unified')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Table already exists, verifying structure...')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Table already exists and is accessible',
          table_exists: true,
          providers_count: existingData?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Table doesn't exist, create it
    console.log('🔧 Creating ai_providers_unified table...')
    
    const createTableSQL = `
      -- Create ai_providers_unified table with complete schema
      CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL UNIQUE,
        provider_type TEXT NOT NULL DEFAULT 'openai',
        is_active BOOLEAN DEFAULT true,
        config JSONB DEFAULT '{}'::jsonb,
        
        -- Additional fields for completeness
        description TEXT,
        api_endpoint TEXT,
        auth_method TEXT DEFAULT 'api_key',
        priority INTEGER DEFAULT 1,
        is_primary BOOLEAN DEFAULT false,
        rate_limit_per_minute INTEGER DEFAULT 60,
        capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
        supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
        
        -- Health monitoring
        last_health_check TIMESTAMPTZ,
        health_status TEXT DEFAULT 'unknown',
        error_count INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 100.00
      );
    `

    const rlsPoliciesSQL = `
      -- Enable RLS
      ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;

      -- Create comprehensive policies
      DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
      CREATE POLICY "Allow superadmin full access" ON public.ai_providers_unified
        FOR ALL USING (
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

      DROP POLICY IF EXISTS "Allow authenticated read" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated read" ON public.ai_providers_unified
        FOR SELECT USING (auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Allow authenticated write" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated write" ON public.ai_providers_unified
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Allow authenticated update" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated update" ON public.ai_providers_unified
        FOR UPDATE USING (auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Allow authenticated delete" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated delete" ON public.ai_providers_unified
        FOR DELETE USING (auth.uid() IS NOT NULL);
    `

    const indexesSQL = `
      -- Create performance indexes
      CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_active ON public.ai_providers_unified(is_active);
      CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type);
      CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_primary ON public.ai_providers_unified(is_primary);
      CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_health ON public.ai_providers_unified(health_status);
    `

    // Execute table creation
    console.log('📝 Executing table creation SQL...')
    const { error: createError } = await supabase.rpc('exec', { 
      sql: createTableSQL + rlsPoliciesSQL + indexesSQL 
    })

    if (createError && !createError.message?.includes('already exists')) {
      throw new Error(`Table creation failed: ${createError.message}`)
    }

    // Insert default providers with comprehensive configuration
    console.log('🌟 Inserting default AI providers...')
    const defaultProviders = [
      {
        name: 'OpenAI',
        provider_type: 'openai',
        is_active: true,
        description: 'OpenAI GPT models for advanced AI processing',
        api_endpoint: 'https://api.openai.com/v1',
        auth_method: 'api_key',
        priority: 1,
        capabilities: ['chat', 'completion', 'embedding', 'vision'],
        supported_languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh'],
        config: {
          api_endpoint: 'https://api.openai.com/v1',
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          default_model: 'gpt-4',
          max_tokens: 4096,
          temperature: 0.7,
          supports_streaming: true,
          supports_function_calling: true
        }
      },
      {
        name: 'Anthropic',
        provider_type: 'anthropic',
        is_active: true,
        description: 'Anthropic Claude models for reasoning and analysis',
        api_endpoint: 'https://api.anthropic.com',
        auth_method: 'api_key',
        priority: 2,
        capabilities: ['chat', 'analysis', 'reasoning', 'coding'],
        supported_languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
        config: {
          api_endpoint: 'https://api.anthropic.com',
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
          default_model: 'claude-3-sonnet',
          max_tokens: 4096,
          temperature: 0.7,
          supports_vision: true
        }
      },
      {
        name: 'Grok/X.AI',
        provider_type: 'grok',
        is_active: true,
        description: 'Grok AI models with real-time capabilities',
        api_endpoint: 'https://api.x.ai/v1',
        auth_method: 'api_key',
        priority: 3,
        capabilities: ['chat', 'real-time', 'analysis'],
        supported_languages: ['en'],
        config: {
          api_endpoint: 'https://api.x.ai/v1',
          models: ['grok-beta', 'grok-2-1212', 'grok-2-vision-1212', 'grok-2-latest'],
          default_model: 'grok-2-latest',
          max_tokens: 4096,
          temperature: 0.7,
          supports_real_time: true
        }
      }
    ]

    const { error: insertError } = await supabase
      .from('ai_providers_unified')
      .upsert(defaultProviders, { onConflict: 'name' })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Default providers insertion failed: ${insertError.message}`)
    }

    // Verify table and data
    console.log('🔍 Verifying table creation and data...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('ai_providers_unified')
      .select('id, name, provider_type, is_active')
      .limit(10)

    if (verifyError) {
      throw new Error(`Table verification failed: ${verifyError.message}`)
    }

    console.log('✅ AI tables auto-setup completed successfully!')
    console.log(`Found ${verifyData.length} providers:`, verifyData.map(p => p.name))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI tables created and configured successfully',
        table_created: true,
        providers_count: verifyData.length,
        providers: verifyData,
        setup_timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Auto-setup error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})