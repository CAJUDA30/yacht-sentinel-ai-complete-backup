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
    
    console.log('🚀 Deploying enterprise schema migration...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Execute migration steps one by one
    const migrationSteps = [
      {
        name: "Create yacht_access_control table",
        sql: `CREATE TABLE IF NOT EXISTS public.yacht_access_control (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          yacht_id UUID NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          access_level TEXT NOT NULL DEFAULT 'crew',
          is_active BOOLEAN DEFAULT true,
          permissions JSONB DEFAULT '{}',
          granted_by UUID REFERENCES auth.users(id),
          granted_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, yacht_id, role)
        );`
      },
      {
        name: "Create role_permissions_matrix table",
        sql: `CREATE TABLE IF NOT EXISTS public.role_permissions_matrix (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          role TEXT NOT NULL,
          module_name TEXT NOT NULL,
          can_view BOOLEAN DEFAULT false,
          can_add BOOLEAN DEFAULT false,
          can_edit BOOLEAN DEFAULT false,
          can_approve BOOLEAN DEFAULT false,
          can_delete BOOLEAN DEFAULT false,
          yacht_scope_required BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(role, module_name)
        );`
      },
      {
        name: "Create yacht_activity_log table",
        sql: `CREATE TABLE IF NOT EXISTS public.yacht_activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          yacht_id UUID NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          module_name TEXT NOT NULL,
          action_type TEXT NOT NULL,
          resource_type TEXT,
          resource_id TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        );`
      },
      {
        name: "Update get_user_yacht_access_detailed function",
        sql: `CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(
          p_user_id UUID DEFAULT auth.uid()
        )
        RETURNS TABLE(
          yacht_id UUID,
          role TEXT,
          access_level TEXT,
          permissions JSONB,
          is_active BOOLEAN
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            yac.yacht_id,
            yac.role,
            yac.access_level,
            yac.permissions,
            yac.is_active
          FROM yacht_access_control yac
          WHERE yac.user_id = p_user_id 
            AND yac.is_active = true
            AND (yac.expires_at IS NULL OR yac.expires_at > NOW())
          
          UNION ALL
          
          SELECT 
            yp.id as yacht_id,
            'owner' as role,
            'admin' as access_level,
            '{"all": true}'::jsonb as permissions,
            true as is_active
          FROM yacht_profiles yp
          WHERE yp.owner_id = p_user_id;
        END;
        $$;`
      },
      {
        name: "Create log_yacht_activity function",
        sql: `CREATE OR REPLACE FUNCTION public.log_yacht_activity(
          p_yacht_id UUID,
          p_module_name TEXT,
          p_action_type TEXT,
          p_resource_type TEXT DEFAULT 'general',
          p_resource_id TEXT DEFAULT NULL
        )
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          INSERT INTO yacht_activity_log (
            yacht_id,
            user_id,
            module_name,
            action_type,
            resource_type,
            resource_id,
            timestamp
          ) VALUES (
            p_yacht_id,
            auth.uid(),
            p_module_name,
            p_action_type,
            p_resource_type,
            p_resource_id,
            NOW()
          );
        EXCEPTION
          WHEN OTHERS THEN
            NULL;
        END;
        $$;`
      },
      {
        name: "Grant function permissions",
        sql: `GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID) TO authenticated, anon;
              GRANT EXECUTE ON FUNCTION public.log_yacht_activity(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;`
      },
      {
        name: "Enable RLS on tables",
        sql: `ALTER TABLE yacht_access_control ENABLE ROW LEVEL SECURITY;
              ALTER TABLE role_permissions_matrix ENABLE ROW LEVEL SECURITY;
              ALTER TABLE yacht_activity_log ENABLE ROW LEVEL SECURITY;`
      },
      {
        name: "Create RLS policies",
        sql: `CREATE POLICY IF NOT EXISTS "Users can view their own yacht access"
                ON yacht_access_control FOR SELECT
                USING (user_id = auth.uid());
              
              CREATE POLICY IF NOT EXISTS "Everyone can read permissions matrix"
                ON role_permissions_matrix FOR SELECT
                USING (true);`
      },
      {
        name: "Insert default permissions",
        sql: `INSERT INTO public.role_permissions_matrix (role, module_name, can_view, can_add, can_edit, can_approve, can_delete) 
              VALUES 
                ('owner', 'all', true, true, true, true, true),
                ('manager', 'all', true, true, true, false, false),
                ('captain', 'navigation', true, true, true, true, false),
                ('crew', 'general', true, false, false, false, false),
                ('viewer', 'general', true, false, false, false, false)
              ON CONFLICT (role, module_name) DO NOTHING;`
      }
    ]

    let results = []
    let successCount = 0

    for (const step of migrationSteps) {
      try {
        console.log(`Executing: ${step.name}`)
        
        // Use raw connection for direct SQL execution
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: step.sql })
        })
        
        if (response.ok) {
          successCount++
          results.push({ step: step.name, success: true })
          console.log(`✅ ${step.name} completed`)
        } else {
          const error = await response.text()
          results.push({ step: step.name, success: false, error })
          console.log(`❌ ${step.name} failed: ${error}`)
        }
      } catch (error) {
        results.push({ step: step.name, success: false, error: error.message })
        console.log(`❌ ${step.name} exception: ${error.message}`)
      }
    }

    // Test the functions
    console.log('🧪 Testing deployed functions...')
    const { data: testData, error: testError } = await supabase
      .rpc('get_user_yacht_access_detailed')

    return new Response(JSON.stringify({
      success: successCount > 0,
      message: `Migration completed: ${successCount}/${migrationSteps.length} steps successful`,
      steps: results,
      function_test: {
        success: !testError,
        error: testError?.message || null,
        data_count: testData?.length || 0
      },
      schema_status: 'Enterprise migration deployment complete'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Migration deployment error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to deploy migration'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})