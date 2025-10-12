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
    
    console.log('🚀 Setting up permanent user roles system...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const results = {
      tableCreation: null,
      policiesSetup: null,
      functionsCreated: null,
      triggersSetup: null,
      superadminCreated: null,
      verification: null
    }

    // Step 1: Create user_roles table with proper schema
    console.log('Creating user_roles table...')
    try {
      // Use direct SQL execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            -- Create user_roles table
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

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
            CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);

            -- Create updated_at trigger
            CREATE OR REPLACE FUNCTION public.update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
            CREATE TRIGGER update_user_roles_updated_at
                BEFORE UPDATE ON public.user_roles
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column();
          `
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      results.tableCreation = { success: true, message: 'user_roles table created successfully' }
      console.log('✅ user_roles table created')

    } catch (error) {
      console.log('Table creation via REST failed, trying direct table creation...')
      
      // Fallback: Try creating table directly without custom SQL
      try {
        // Check if table exists first
        const { data: existingTable } = await supabase
          .from('user_roles')
          .select('count', { count: 'exact', head: true })
          
        if (existingTable !== null) {
          results.tableCreation = { success: true, message: 'user_roles table already exists' }
          console.log('✅ user_roles table already exists')
        } else {
          // Table doesn't exist, we need to create it manually
          results.tableCreation = { success: false, error: `Table creation failed: ${error.message}. Please create the table manually.` }
          console.error('❌ Table creation failed:', error.message)
        }
      } catch (fallbackError) {
        results.tableCreation = { success: false, error: `Table creation failed: ${error.message}` }
        console.error('❌ Table creation failed:', error.message)
      }
    }

    // Step 2: Set up Row Level Security
    console.log('Setting up Row Level Security...')
    try {
      const { error: rlsError } = await supabase.rpc('exec', {
        sql: `
          -- Enable RLS
          ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
          DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
          DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
          DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

          -- Create RLS policies
          CREATE POLICY "Users can view their own roles" 
            ON public.user_roles FOR SELECT 
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own roles" 
            ON public.user_roles FOR INSERT 
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Admins can manage all roles" 
            ON public.user_roles FOR ALL 
            USING (
              EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'superadmin') 
                AND is_active = true
              )
            );

          CREATE POLICY "Service role can manage all roles" 
            ON public.user_roles FOR ALL 
            USING (auth.role() = 'service_role');
        `
      })

      if (rlsError) {
        throw new Error(`RLS setup failed: ${rlsError.message}`)
      }

      results.policiesSetup = { success: true, message: 'RLS policies created successfully' }
      console.log('✅ RLS policies created')

    } catch (error) {
      results.policiesSetup = { success: false, error: error.message }
      console.error('❌ RLS setup failed:', error.message)
    }

    // Step 3: Create RPC functions
    console.log('Creating RPC functions...')
    try {
      const { error: functionsError } = await supabase.rpc('exec', {
        sql: `
          -- Function to check if user is superadmin
          CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            target_user_id UUID;
          BEGIN
            -- Use provided user_id or current user
            target_user_id := COALESCE(_user_id, auth.uid());
            
            -- Return false if no user
            IF target_user_id IS NULL THEN
              RETURN false;
            END IF;
            
            -- Check if user has superadmin role
            RETURN EXISTS (
              SELECT 1 
              FROM public.user_roles 
              WHERE user_id = target_user_id 
              AND role = 'superadmin'
              AND is_active = true
            );
          END;
          $$;

          -- Function to get user roles
          CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID DEFAULT NULL)
          RETURNS TABLE (
            role TEXT,
            created_at TIMESTAMPTZ,
            is_active BOOLEAN
          )
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            target_user_id UUID;
          BEGIN
            target_user_id := COALESCE(_user_id, auth.uid());
            
            IF target_user_id IS NULL THEN
              RETURN;
            END IF;
            
            RETURN QUERY
            SELECT ur.role, ur.created_at, ur.is_active
            FROM public.user_roles ur
            WHERE ur.user_id = target_user_id
            ORDER BY 
              CASE ur.role 
                WHEN 'superadmin' THEN 5 
                WHEN 'admin' THEN 4 
                WHEN 'manager' THEN 3 
                WHEN 'user' THEN 2 
                WHEN 'viewer' THEN 1 
                ELSE 0 
              END DESC;
          END;
          $$;

          -- Function to assign user role (admin/superadmin only)
          CREATE OR REPLACE FUNCTION public.assign_user_role(
            target_user_id UUID,
            new_role TEXT
          )
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Check if current user is admin or superadmin
            IF NOT EXISTS (
              SELECT 1 FROM public.user_roles 
              WHERE user_id = auth.uid() 
              AND role IN ('admin', 'superadmin') 
              AND is_active = true
            ) THEN
              RAISE EXCEPTION 'Insufficient permissions to assign roles';
            END IF;

            -- Validate role
            IF new_role NOT IN ('viewer', 'user', 'manager', 'admin', 'superadmin') THEN
              RAISE EXCEPTION 'Invalid role specified';
            END IF;

            -- Insert or update role
            INSERT INTO public.user_roles (user_id, role, created_by)
            VALUES (target_user_id, new_role, auth.uid())
            ON CONFLICT (user_id, role) 
            DO UPDATE SET 
              is_active = true,
              updated_at = NOW(),
              created_by = auth.uid();

            RETURN true;
          END;
          $$;

          -- Grant execute permissions
          GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon;
          GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated, anon;
          GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;
        `
      })

      if (functionsError) {
        throw new Error(`Functions creation failed: ${functionsError.message}`)
      }

      results.functionsCreated = { success: true, message: 'RPC functions created successfully' }
      console.log('✅ RPC functions created')

    } catch (error) {
      results.functionsCreated = { success: false, error: error.message }
      console.error('❌ Functions creation failed:', error.message)
    }

    // Step 4: Create automatic user role assignment trigger
    console.log('Setting up user registration trigger...')
    try {
      const { error: triggerError } = await supabase.rpc('exec', {
        sql: `
          -- Function to handle new user registration
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS trigger
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Assign default 'user' role to new users
            INSERT INTO public.user_roles (user_id, role, created_by)
            VALUES (NEW.id, 'user', NEW.id);
            
            RETURN NEW;
          END;
          $$;

          -- Create trigger for new user registration
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
        `
      })

      if (triggerError) {
        throw new Error(`Trigger setup failed: ${triggerError.message}`)
      }

      results.triggersSetup = { success: true, message: 'User registration trigger created successfully' }
      console.log('✅ User registration trigger created')

    } catch (error) {
      results.triggersSetup = { success: false, error: error.message }
      console.error('❌ Trigger setup failed:', error.message)
    }

    // Step 5: Create superadmin user
    console.log('Creating superadmin user...')
    try {
      const { error: superadminError } = await supabase
        .from('user_roles')
        .upsert([{
          user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
          role: 'superadmin',
          created_by: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
          is_active: true
        }], {
          onConflict: 'user_id,role'
        })

      if (superadminError) {
        throw new Error(`Superadmin creation failed: ${superadminError.message}`)
      }

      results.superadminCreated = { success: true, message: 'Superadmin role assigned successfully' }
      console.log('✅ Superadmin role assigned')

    } catch (error) {
      results.superadminCreated = { success: false, error: error.message }
      console.error('❌ Superadmin creation failed:', error.message)
    }

    // Step 6: Verification
    console.log('Verifying setup...')
    try {
      // Test table exists
      const { data: tableTest, error: tableTestError } = await supabase
        .from('user_roles')
        .select('count', { count: 'exact', head: true })

      // Test RPC function
      const { data: rpcTest, error: rpcTestError } = await supabase
        .rpc('is_superadmin', { _user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac' })

      // Test superadmin role exists
      const { data: roleTest, error: roleTestError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', '6d201176-5be1-45d4-b09f-f70cb4ad38ac')
        .eq('role', 'superadmin')

      results.verification = {
        tableExists: !tableTestError,
        rpcFunctionWorks: !rpcTestError && rpcTest === true,
        superadminExists: !roleTestError && roleTest && roleTest.length > 0,
        tableCount: tableTest?.count || 0
      }

      console.log('✅ Verification completed')

    } catch (error) {
      results.verification = { success: false, error: error.message }
      console.error('❌ Verification failed:', error.message)
    }

    // Determine overall success
    const overallSuccess = 
      results.tableCreation?.success &&
      results.policiesSetup?.success &&
      results.functionsCreated?.success &&
      results.triggersSetup?.success &&
      results.superadminCreated?.success

    return new Response(JSON.stringify({
      success: overallSuccess,
      message: 'Permanent user roles system setup completed',
      results,
      ready_for_production: overallSuccess && results.verification?.rpcFunctionWorks,
      next_steps: [
        'Test login with superadmin@yachtexcel.com',
        'Verify role synchronization in app settings',
        'Test user registration creates default roles',
        'Verify RPC functions work correctly'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to set up permanent user roles system'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})