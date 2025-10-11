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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('🔧 Creating missing database tables...')

    // Create yacht_profiles table
    const yachtProfilesSQL = `
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
    `

    // Create equipment table
    const equipmentSQL = `
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
    `

    // Enable RLS
    const rlsSQL = `
      ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
    `

    // Create RLS policies for yacht_profiles
    const yachtPoliciesSQL = `
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

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'yacht_profiles' 
              AND policyname = 'Users can insert their own yacht profiles'
          ) THEN
              CREATE POLICY "Users can insert their own yacht profiles" ON yacht_profiles
                  FOR INSERT WITH CHECK (auth.uid() = owner_id);
          END IF;
      END $$;

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'yacht_profiles' 
              AND policyname = 'Users can update their own yacht profiles'
          ) THEN
              CREATE POLICY "Users can update their own yacht profiles" ON yacht_profiles
                  FOR UPDATE USING (auth.uid() = owner_id);
          END IF;
      END $$;
    `

    // Create RLS policies for equipment
    const equipmentPoliciesSQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'equipment' 
              AND policyname = 'Users can view equipment for their yachts'
          ) THEN
              CREATE POLICY "Users can view equipment for their yachts" ON equipment
                  FOR SELECT USING (
                      yacht_id IN (
                          SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                      )
                  );
          END IF;
      END $$;

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'equipment' 
              AND policyname = 'Users can insert equipment for their yachts'
          ) THEN
              CREATE POLICY "Users can insert equipment for their yachts" ON equipment
                  FOR INSERT WITH CHECK (
                      yacht_id IN (
                          SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                      )
                  );
          END IF;
      END $$;

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'equipment' 
              AND policyname = 'Users can update equipment for their yachts'
          ) THEN
              CREATE POLICY "Users can update equipment for their yachts" ON equipment
                  FOR UPDATE USING (
                      yacht_id IN (
                          SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                      )
                  );
          END IF;
      END $$;
    `

    // Create the missing RPC function
    const rpcFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
      RETURNS TABLE (
          yacht_id UUID,
          yacht_name TEXT,
          yacht_type TEXT,
          access_level TEXT,
          permissions JSONB
      ) AS $$
      BEGIN
          -- Use current user if no target specified
          IF target_user_id IS NULL THEN
              target_user_id := auth.uid();
          END IF;
          
          -- Return yacht access details for the user
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

    const results = []

    // Execute each SQL statement
    const statements = [
      { name: 'yacht_profiles table', sql: yachtProfilesSQL },
      { name: 'equipment table', sql: equipmentSQL },
      { name: 'RLS enable', sql: rlsSQL },
      { name: 'yacht_profiles policies', sql: yachtPoliciesSQL },
      { name: 'equipment policies', sql: equipmentPoliciesSQL },
      { name: 'RPC function', sql: rpcFunctionSQL }
    ]

    for (const statement of statements) {
      try {
        console.log(`🔧 Creating: ${statement.name}`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement.sql })
        
        if (error) {
          console.error(`❌ Error creating ${statement.name}:`, error)
          results.push({ name: statement.name, success: false, error: error.message })
        } else {
          console.log(`✅ Created: ${statement.name}`)
          results.push({ name: statement.name, success: true })
        }
      } catch (err) {
        console.error(`❌ Exception creating ${statement.name}:`, err)
        results.push({ name: statement.name, success: false, error: err.message })
      }
    }

    // Check if tables were created successfully
    try {
      const { data: yachtProfiles, error: yachtError } = await supabase
        .from('yacht_profiles')
        .select('count', { count: 'exact', head: true })

      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('count', { count: 'exact', head: true })

      const verification = {
        yacht_profiles: !yachtError,
        equipment: !equipmentError,
        yacht_profiles_error: yachtError?.message || null,
        equipment_error: equipmentError?.message || null
      }

      console.log('🎯 Verification results:', verification)

      return new Response(JSON.stringify({
        success: true,
        message: 'Database tables creation completed',
        results,
        verification,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (verifyError) {
      console.error('❌ Verification error:', verifyError)
      return new Response(JSON.stringify({
        success: false,
        message: 'Tables created but verification failed',
        results,
        verification_error: verifyError.message,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})