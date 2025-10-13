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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create the is_superadmin function that the app expects
    const sql = `
      -- Create the parameterless version that the app is calling
      CREATE OR REPLACE FUNCTION public.is_superadmin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_email TEXT;
      BEGIN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        RETURN user_email = 'superadmin@yachtexcel.com';
      END;
      $$;

      -- Also create the parametered version for compatibility
      CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_email TEXT;
      BEGIN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = _user_id;
        
        RETURN user_email = 'superadmin@yachtexcel.com';
      END;
      $$;

      -- Grant permissions
      GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;

      -- Create the missing AI tables  
      CREATE TABLE IF NOT EXISTS ai_providers_unified (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS ai_models_unified (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL,
        model_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS ai_health (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        provider_id UUID,
        status TEXT NOT NULL DEFAULT 'healthy'
      );

      -- Enable RLS and create policies
      ALTER TABLE ai_providers_unified ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ai_models_unified ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ai_health ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Allow read" ON ai_providers_unified FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow read" ON ai_models_unified FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow read" ON ai_health FOR SELECT USING (true);
    `;

    // Execute SQL using direct query
    const { error } = await supabase.from('_dummy').select('1').limit(1);
    // This will fail but that's ok, we just need the connection

    // Try to execute via raw SQL
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`SQL execution failed: ${response.status} ${await response.text()}`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'is_superadmin function and AI tables created successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})