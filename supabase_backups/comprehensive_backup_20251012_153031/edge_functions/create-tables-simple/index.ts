import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('🔧 Creating missing tables...')

    // Create yacht_profiles table directly
    const { error: yachtError } = await supabase.rpc('exec', {
      sql: `CREATE TABLE IF NOT EXISTS yacht_profiles (
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
      );`
    })

    // Create equipment table directly
    const { error: equipmentError } = await supabase.rpc('exec', {
      sql: `CREATE TABLE IF NOT EXISTS equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        yacht_id UUID REFERENCES yacht_profiles(id),
        equipment_name TEXT NOT NULL,
        equipment_type TEXT,
        manufacturer TEXT,
        model TEXT,
        serial_number TEXT,
        installation_date DATE,
        next_maintenance_date DATE,
        maintenance_interval_days INTEGER,
        status TEXT DEFAULT 'operational',
        location_on_yacht TEXT,
        specifications JSONB,
        maintenance_history JSONB DEFAULT '[]'::jsonb
      );`
    })

    // Create RPC function
    const { error: rpcError } = await supabase.rpc('exec', {
      sql: `CREATE OR REPLACE FUNCTION get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
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
      
      GRANT EXECUTE ON FUNCTION get_user_yacht_access_detailed TO authenticated;`
    })

    // Test tables exist
    const { data: yachtTest } = await supabase.from('yacht_profiles').select('count', { count: 'exact', head: true })
    const { data: equipmentTest } = await supabase.from('equipment').select('count', { count: 'exact', head: true })

    return new Response(JSON.stringify({
      success: true,
      results: {
        yacht_profiles: !yachtError,
        equipment: !equipmentError,
        rpc_function: !rpcError,
        verification: {
          yacht_profiles_accessible: yachtTest !== null,
          equipment_accessible: equipmentTest !== null
        }
      },
      errors: {
        yacht_profiles: yachtError?.message || null,
        equipment: equipmentError?.message || null,
        rpc_function: rpcError?.message || null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})