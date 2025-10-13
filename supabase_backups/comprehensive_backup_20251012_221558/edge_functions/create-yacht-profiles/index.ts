import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use simple fetch to Supabase database via SQL endpoint
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS yacht_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            yacht_name TEXT,
            yacht_type TEXT,
            length_overall DECIMAL,
            beam DECIMAL,
            draft DECIMAL,
            year_built INTEGER,
            builder TEXT,
            flag_state TEXT,
            registration_number TEXT,
            imo_number TEXT,
            call_sign TEXT,
            owner_id UUID REFERENCES auth.users(id),
            status TEXT DEFAULT 'active'
          );
          
          ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can view their own yacht profiles" ON yacht_profiles
            FOR SELECT USING (auth.uid() = owner_id);
            
          CREATE POLICY IF NOT EXISTS "Users can insert their own yacht profiles" ON yacht_profiles
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
            
          CREATE POLICY IF NOT EXISTS "Users can update their own yacht profiles" ON yacht_profiles
            FOR UPDATE USING (auth.uid() = owner_id);
            
          CREATE OR REPLACE FUNCTION get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
          RETURNS TABLE (
            yacht_id UUID,
            yacht_name TEXT,
            yacht_type TEXT,
            access_level TEXT,
            permissions JSONB
          ) AS $$
          BEGIN
            IF target_user_id IS NULL THEN
              target_user_id := auth.uid();
            END IF;
            
            RETURN QUERY
            SELECT 
              yp.id as yacht_id,
              yp.yacht_name,
              yp.yacht_type,
              'owner'::TEXT as access_level,
              '{"read": true, "write": true, "admin": true}'::JSONB as permissions
            FROM yacht_profiles yp
            WHERE yp.owner_id = target_user_id;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          GRANT EXECUTE ON FUNCTION get_user_yacht_access_detailed TO authenticated;
        `
      })
    });

    const data = await response.text();
    
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Tables created successfully' : 'Failed to create tables',
        details: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})