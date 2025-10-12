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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🚀 Creating missing tables directly with SQL...');

    // Execute SQL statements directly
    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS yacht_profiles (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS equipment (
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
      );`,

      `ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;`,

      `DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'yacht_profiles' 
          AND policyname = 'Users can view their own yacht profiles'
        ) THEN
          CREATE POLICY "Users can view their own yacht profiles" ON yacht_profiles
            FOR SELECT USING (auth.uid() = owner_id);
        END IF;
      END $$;`,

      `CREATE OR REPLACE FUNCTION get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
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
      $$ LANGUAGE plpgsql SECURITY DEFINER;`,

      `GRANT EXECUTE ON FUNCTION get_user_yacht_access_detailed TO authenticated;`
    ];

    const results = [];
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      const description = sql.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      try {
        console.log(`Executing ${i + 1}/${sqlStatements.length}: ${description}`);
        
        // Use raw SQL execution
        const { data, error } = await supabaseClient.rpc('sql', { query: sql });
        
        if (error) {
          console.error(`SQL Error for statement ${i + 1}:`, error);
          results.push({ 
            statement: i + 1, 
            description, 
            success: false, 
            error: error.message 
          });
        } else {
          console.log(`Success for statement ${i + 1}`);
          results.push({ 
            statement: i + 1, 
            description, 
            success: true 
          });
        }
      } catch (err) {
        console.error(`Exception for statement ${i + 1}:`, err);
        results.push({ 
          statement: i + 1, 
          description, 
          success: false, 
          error: err.message 
        });
      }
    }

    // Test table access
    const testResults = {};
    const tablesToTest = ['yacht_profiles', 'equipment'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabaseClient.from(table).select('id').limit(1);
        testResults[table] = error ? `Error: ${error.message}` : 'Table accessible';
      } catch (e) {
        testResults[table] = `Exception: ${e.message}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Table creation process completed',
        execution_results: results,
        test_results: testResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})