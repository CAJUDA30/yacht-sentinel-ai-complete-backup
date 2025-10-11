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
    
    console.log('🔧 Ensuring user roles system is functional...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const results = {
      tableCheck: null,
      superadminSetup: null,
      functionsTest: null,
      verification: null
    }

    // Step 1: Check if user_roles table exists and is accessible
    console.log('Checking user_roles table...')
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('user_roles')
        .select('count', { count: 'exact', head: true })

      if (tableError) {
        results.tableCheck = { 
          exists: false, 
          error: tableError.message,
          needsManualCreation: true
        }
        console.log('❌ user_roles table does not exist or is not accessible')
      } else {
        results.tableCheck = { 
          exists: true, 
          count: tableData?.count || 0 
        }
        console.log(`✅ user_roles table exists with ${tableData?.count || 0} records`)
      }
    } catch (error) {
      results.tableCheck = { exists: false, error: error.message }
      console.error('❌ Error checking table:', error.message)
    }

    // Step 2: Ensure superadmin role exists
    console.log('Setting up superadmin role...')
    try {
      if (results.tableCheck?.exists) {
        // Try to insert superadmin role
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', '6d201176-5be1-45d4-b09f-f70cb4ad38ac')
          .eq('role', 'superadmin')
          .maybeSingle()

        if (existingRole) {
          results.superadminSetup = { 
            exists: true, 
            message: 'Superadmin role already exists' 
          }
          console.log('✅ Superadmin role already exists')
        } else {
          // Insert superadmin role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
              role: 'superadmin',
              created_by: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
              is_active: true
            }])

          if (insertError) {
            results.superadminSetup = { 
              success: false, 
              error: insertError.message 
            }
            console.error('❌ Failed to create superadmin role:', insertError.message)
          } else {
            results.superadminSetup = { 
              success: true, 
              message: 'Superadmin role created successfully' 
            }
            console.log('✅ Superadmin role created')
          }
        }
      } else {
        results.superadminSetup = { 
          success: false, 
          error: 'Cannot create superadmin role - table does not exist' 
        }
      }
    } catch (error) {
      results.superadminSetup = { success: false, error: error.message }
      console.error('❌ Superadmin setup failed:', error.message)
    }

    // Step 3: Test RPC functions (if they exist)
    console.log('Testing RPC functions...')
    try {
      // Test is_superadmin function
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('is_superadmin', { _user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac' })

      if (rpcError) {
        results.functionsTest = { 
          exists: false, 
          error: rpcError.message,
          needsManualCreation: true
        }
        console.log('❌ RPC functions not available:', rpcError.message)
      } else {
        results.functionsTest = { 
          exists: true, 
          isSuper: rpcTest === true 
        }
        console.log(`✅ RPC functions work, superadmin test result: ${rpcTest}`)
      }
    } catch (error) {
      results.functionsTest = { exists: false, error: error.message }
      console.error('❌ RPC function test failed:', error.message)
    }

    // Step 4: Final verification
    console.log('Final verification...')
    try {
      if (results.tableCheck?.exists) {
        // Count total roles
        const { data: roleCount } = await supabase
          .from('user_roles')
          .select('role, count(*)', { count: 'exact' })

        // Check superadmin specifically
        const { data: superadminCheck } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', '6d201176-5be1-45d4-b09f-f70cb4ad38ac')
          .eq('role', 'superadmin')
          .eq('is_active', true)

        results.verification = {
          tableAccessible: true,
          totalRoles: roleCount?.length || 0,
          superadminExists: superadminCheck && superadminCheck.length > 0,
          systemReady: (superadminCheck && superadminCheck.length > 0) || results.functionsTest?.isSuper
        }
      } else {
        results.verification = {
          tableAccessible: false,
          systemReady: false,
          needsManualSetup: true
        }
      }
    } catch (error) {
      results.verification = { error: error.message }
    }

    const isSystemReady = results.verification?.systemReady || false

    return new Response(JSON.stringify({
      success: isSystemReady,
      message: 'User roles system check completed',
      systemReady: isSystemReady,
      results,
      recommendations: generateRecommendations(results),
      manualSetupRequired: !results.tableCheck?.exists,
      sqlSetupScript: generateSQLSetup()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ System check failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to check user roles system'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = []

  if (!results.tableCheck?.exists) {
    recommendations.push('❗ Create user_roles table manually using the provided SQL script')
    recommendations.push('🔧 Run the SQL setup script in Supabase SQL Editor')
  }

  if (!results.functionsTest?.exists) {
    recommendations.push('⚡ Create RPC functions for user role management')
  }

  if (results.tableCheck?.exists && !results.superadminSetup?.success) {
    recommendations.push('👤 Manually insert superadmin role into user_roles table')
  }

  if (results.verification?.systemReady) {
    recommendations.push('✅ System is ready - test login with superadmin@yachtexcel.com')
    recommendations.push('🧪 Verify role synchronization in app settings')
  }

  return recommendations
}

function generateSQLSetup(): string {
  return `
-- User Roles System Setup SQL
-- Run this in Supabase SQL Editor if automatic setup failed

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'user', 'manager', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles" 
  ON public.user_roles FOR ALL 
  USING (auth.role() = 'service_role');

-- 5. Create RPC function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND role = 'superadmin'
    AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;

-- 6. Insert superadmin role
INSERT INTO public.user_roles (user_id, role, created_by, is_active)
VALUES ('6d201176-5be1-45d4-b09f-f70cb4ad38ac', 'superadmin', '6d201176-5be1-45d4-b09f-f70cb4ad38ac', true)
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

-- 7. Create trigger for new users (optional)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user', NEW.id);
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
`
}