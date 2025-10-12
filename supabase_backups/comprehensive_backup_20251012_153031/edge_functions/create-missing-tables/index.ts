import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log('Creating missing database tables...');

    // SQL for creating missing tables
    const createTablesSQL = `
      -- 1. yacht_profiles table
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

      -- 2. equipment table
      CREATE TABLE IF NOT EXISTS equipment (
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
      );

      -- 3. user_personalization_profiles table
      CREATE TABLE IF NOT EXISTS user_personalization_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id) UNIQUE,
          interaction_preferences JSONB DEFAULT '{}'::jsonb,
          dashboard_settings JSONB DEFAULT '{}'::jsonb,
          notification_preferences JSONB DEFAULT '{}'::jsonb,
          theme_preferences JSONB DEFAULT '{}'::jsonb,
          language_preference TEXT DEFAULT 'en',
          timezone TEXT DEFAULT 'UTC'
      );

      -- Enable RLS on all tables
      ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_personalization_profiles ENABLE ROW LEVEL SECURITY;
    `;

    // Execute the SQL to create tables
    const { data: createResult, error: createError } = await supabaseClient.rpc('exec_sql', {
      sql: createTablesSQL
    });

    if (createError) {
      console.error('Error creating tables with RPC:', createError);
      
      // Try alternative approach using individual queries
      const queries = [
        // Create yacht_profiles table
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
        )`,
        
        // Create equipment table
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
        )`,
        
        // Create user_personalization_profiles table
        `CREATE TABLE IF NOT EXISTS user_personalization_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id) UNIQUE,
          interaction_preferences JSONB DEFAULT '{}'::jsonb,
          dashboard_settings JSONB DEFAULT '{}'::jsonb,
          notification_preferences JSONB DEFAULT '{}'::jsonb,
          theme_preferences JSONB DEFAULT '{}'::jsonb,
          language_preference TEXT DEFAULT 'en',
          timezone TEXT DEFAULT 'UTC'
        )`
      ];

      // Try to execute each query individually
      const results = [];
      for (const query of queries) {
        try {
          const { data, error } = await supabaseClient.from('_sql').select().eq('query', query);
          if (error) {
            console.error(`Query failed: ${query.substring(0, 50)}...`, error);
            results.push({ query: query.substring(0, 50), success: false, error: error.message });
          } else {
            results.push({ query: query.substring(0, 50), success: true });
          }
        } catch (e) {
          console.error(`Exception executing query: ${query.substring(0, 50)}...`, e);
          results.push({ query: query.substring(0, 50), success: false, error: e.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tables creation attempted with individual queries',
          results,
          original_error: createError
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Create RLS policies
    const policiesSQL = `
      -- Create RLS policies for yacht_profiles
      DO $$ 
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
      END $$;

      -- Create the missing RPC function get_user_yacht_access_detailed
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
    `;

    const { data: policiesResult, error: policiesError } = await supabaseClient.rpc('exec_sql', {
      sql: policiesSQL
    });

    if (policiesError) {
      console.error('Error creating policies:', policiesError);
    }

    // Test table creation by querying each table
    const testResults = {};
    const tablesToTest = ['yacht_profiles', 'equipment', 'user_personalization_profiles'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabaseClient.from(table).select('*').limit(1);
        testResults[table] = error ? `Error: ${error.message}` : 'Table accessible';
      } catch (e) {
        testResults[table] = `Exception: ${e.message}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database tables creation completed',
        created_tables: ['yacht_profiles', 'equipment', 'user_personalization_profiles'],
        rpc_functions: ['get_user_yacht_access_detailed'],
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