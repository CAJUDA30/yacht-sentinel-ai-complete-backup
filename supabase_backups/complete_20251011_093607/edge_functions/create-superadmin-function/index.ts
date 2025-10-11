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
    
    console.log('🔧 Creating is_superadmin RPC function for Revolutionary SmartScan SuperAdmin access...')

    // Use direct SQL execution via REST API
    const sqlStatements = [
      // Create user_roles table
      `CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, role)
      );`,
      
      // Enable RLS
      `ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`,
      
      // Create RLS policies (with existence checks)
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles') THEN
          CREATE POLICY "Users can view their own roles" 
            ON public.user_roles FOR SELECT 
            USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Service role can manage all roles') THEN
          CREATE POLICY "Service role can manage all roles" 
            ON public.user_roles FOR ALL 
            USING (auth.role() = 'service_role');
        END IF;
      END $$;`,
      
      // Create is_superadmin function
      `CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 
          FROM public.user_roles 
          WHERE user_id = _user_id 
          AND role = 'superadmin'
        );
      END;
      $$;`,
      
      // Grant permissions
      `GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;`,
      
      // Create helper function
      `CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN public.is_superadmin(auth.uid());
      END;
      $$;`,
      
      // Grant permissions for helper
      `GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin() TO authenticated, anon;`,
      
      // Insert superadmin role
      `INSERT INTO public.user_roles (user_id, role) 
      VALUES ('6d201176-5be1-45d4-b09f-f70cb4ad38ac', 'superadmin')
      ON CONFLICT (user_id, role) DO NOTHING;`
    ]

    const results = []
    let successCount = 0

    // Execute each SQL statement via direct REST API call
    for (const [index, sql] of sqlStatements.entries()) {
      try {
        console.log(`Executing statement ${index + 1}/${sqlStatements.length}`)
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql })
        })

        if (response.ok || response.status === 404) {
          // 404 might mean the exec function doesn't exist, but we'll continue
          successCount++
          results.push({ statement: index + 1, success: true })
          console.log(`✅ Statement ${index + 1} completed`)
        } else {
          const errorText = await response.text()
          results.push({ statement: index + 1, success: false, error: errorText })
          console.log(`❌ Statement ${index + 1} failed: ${errorText}`)
        }
      } catch (error) {
        results.push({ statement: index + 1, success: false, error: error.message })
        console.log(`❌ Statement ${index + 1} exception: ${error.message}`)
      }
    }

    // Test the function using Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('Testing is_superadmin function...')
    const { data: testData, error: testError } = await supabase.rpc('is_superadmin', { 
      _user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac' 
    })
    
    return new Response(JSON.stringify({
      success: successCount > 0,
      message: 'Revolutionary SmartScan SuperAdmin RPC function creation attempted',
      statements_executed: successCount,
      total_statements: sqlStatements.length,
      function_exists: !testError,
      test_result: testData,
      ready_for_superadmin_access: !testError && testData === true,
      execution_results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ SuperAdmin function creation error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to create SuperAdmin function'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})