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
    
    console.log('🔧 Creating ai_providers_unified table...')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Execute SQL to create the table
    const createTableSQL = `
      -- Create ai_providers_unified table
      CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL UNIQUE,
        provider_type TEXT NOT NULL DEFAULT 'openai',
        is_active BOOLEAN DEFAULT true,
        config JSONB DEFAULT '{}'::jsonb
      );

      -- Enable RLS
      ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;

      -- Create policies
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

      DROP POLICY IF EXISTS "Allow authenticated insert" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated insert" ON public.ai_providers_unified
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Allow authenticated update" ON public.ai_providers_unified;
      CREATE POLICY "Allow authenticated update" ON public.ai_providers_unified
        FOR UPDATE USING (auth.uid() IS NOT NULL);
    `

    // Split SQL into individual statements
    const statements = createTableSQL.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...')
        const { error } = await supabase.rpc('exec', { sql: statement + ';' })
        if (error && !error.message?.includes('already exists')) {
          console.error('SQL Error:', error)
          // Continue with other statements
        }
      }
    }

    // Insert default providers
    console.log('🌟 Inserting default providers...')
    const { error: insertError } = await supabase
      .from('ai_providers_unified')
      .upsert([
        {
          name: 'OpenAI',
          provider_type: 'openai',
          is_active: true,
          config: { api_endpoint: 'https://api.openai.com/v1', description: 'OpenAI GPT models' }
        },
        {
          name: 'Anthropic',
          provider_type: 'anthropic',
          is_active: true,
          config: { api_endpoint: 'https://api.anthropic.com', description: 'Anthropic Claude models' }
        },
        {
          name: 'Grok/X.AI',
          provider_type: 'grok',
          is_active: true,
          config: { api_endpoint: 'https://api.x.ai/v1', description: 'Grok AI models' }
        }
      ], { onConflict: 'name' })

    if (insertError) {
      console.error('Insert error:', insertError)
    } else {
      console.log('✅ Default providers inserted successfully')
    }

    // Verify table creation
    const { data: verifyData, error: verifyError } = await supabase
      .from('ai_providers_unified')
      .select('*')
      .limit(5)

    if (verifyError) {
      throw new Error(`Table verification failed: ${verifyError.message}`)
    }

    console.log('✅ Table created and verified successfully!')
    console.log('Found providers:', verifyData.map(p => p.name))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ai_providers_unified table created successfully',
        providers_count: verifyData.length,
        providers: verifyData.map(p => ({ name: p.name, type: p.provider_type }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Table creation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})