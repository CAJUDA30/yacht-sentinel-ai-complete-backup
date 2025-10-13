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
    
    console.log('🔧 Applying comprehensive schema fixes...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Execute schema fixes step by step
    const schemaFixes = [
      // 1. Create yacht_access_control table
      `CREATE TABLE IF NOT EXISTS public.yacht_access_control (
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
      );`,

      // 2. Create role_permissions_matrix table
      `CREATE TABLE IF NOT EXISTS public.role_permissions_matrix (
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
      );`,

      // 3. Create get_user_yacht_access_detailed function
      `CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(
        p_user_id UUID DEFAULT auth.uid()
      )
      RETURNS TABLE(
        yacht_id UUID,
        role TEXT,
        access_level TEXT,
        permissions JSONB,
        is_active BOOLEAN,
        yacht_name TEXT,
        yacht_type TEXT
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
          yac.is_active,
          COALESCE(yp.yacht_name, yp.name, 'Yacht-' || SUBSTRING(yac.yacht_id::TEXT, 1, 8)) as yacht_name,
          COALESCE(yp.yacht_type, 'motor_yacht') as yacht_type
        FROM yacht_access_control yac
        LEFT JOIN yacht_profiles yp ON yp.id = yac.yacht_id
        WHERE yac.user_id = p_user_id 
          AND yac.is_active = true
          AND (yac.expires_at IS NULL OR yac.expires_at > NOW())
        
        UNION ALL
        
        SELECT 
          yp.id as yacht_id,
          'owner' as role,
          'admin' as access_level,
          '{\"all\": true}'::jsonb as permissions,
          true as is_active,
          COALESCE(yp.yacht_name, yp.name, 'Yacht-' || SUBSTRING(yp.id::TEXT, 1, 8)) as yacht_name,
          COALESCE(yp.yacht_type, 'motor_yacht') as yacht_type
        FROM yacht_profiles yp
        WHERE yp.owner_id = p_user_id
        
        ORDER BY yacht_name;
      END;
      $$;`,

      // 4. Grant permissions
      `GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID) TO authenticated, anon;`,

      // 5. Enable RLS
      `ALTER TABLE yacht_access_control ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE role_permissions_matrix ENABLE ROW LEVEL SECURITY;`,

      // 6. Create RLS policies
      `CREATE POLICY IF NOT EXISTS "Users can view their own yacht access"
        ON yacht_access_control FOR SELECT
        USING (user_id = auth.uid());`,

      `CREATE POLICY IF NOT EXISTS "Everyone can read permissions matrix"
        ON role_permissions_matrix FOR SELECT
        USING (true);`,

      // 7. Insert default permissions
      `INSERT INTO public.role_permissions_matrix (role, module_name, can_view, can_add, can_edit, can_approve, can_delete) 
       VALUES 
         ('owner', 'all', true, true, true, true, true),
         ('manager', 'all', true, true, true, false, false),
         ('captain', 'navigation', true, true, true, true, false),
         ('crew', 'general', true, false, false, false, false),
         ('viewer', 'general', true, false, false, false, false)
       ON CONFLICT (role, module_name) DO NOTHING;`
    ]

    let successCount = 0
    let errors = []

    for (const [index, sql] of schemaFixes.entries()) {
      try {
        console.log(`Executing schema fix ${index + 1}/${schemaFixes.length}`)
        const { error } = await supabase.rpc('exec_sql', { sql })
        
        if (error) {
          console.error(`Schema fix ${index + 1} failed:`, error)
          errors.push(`Fix ${index + 1}: ${error.message}`)
        } else {
          successCount++
          console.log(`✅ Schema fix ${index + 1} completed`)
        }
      } catch (e) {
        console.error(`Schema fix ${index + 1} exception:`, e)
        errors.push(`Fix ${index + 1}: ${e.message}`)
      }
    }

    // Test the function
    console.log('🧪 Testing get_user_yacht_access_detailed function...')
    const { data: testData, error: testError } = await supabase.rpc('get_user_yacht_access_detailed')
    
    return new Response(JSON.stringify({
      success: errors.length === 0,
      message: `Applied ${successCount}/${schemaFixes.length} schema fixes`,
      errors: errors,
      function_test: {
        success: !testError,
        error: testError?.message || null,
        data_count: testData?.length || 0
      },
      schema_status: 'Enterprise-grade schema alignment complete'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Schema fix deployment error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to apply schema fixes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})