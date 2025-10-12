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
    
    console.log('🔧 Executing user roles SQL setup...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Step 1: Insert superadmin role directly
    console.log('Inserting superadmin role...')
    try {
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert([{
          user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
          role: 'superadmin',
          created_by: '6d201176-5be1-45d4-b09f-f70cb4ad38ac',
          is_active: true
        }], {
          onConflict: 'user_id,role'
        })

      if (insertError) {
        console.error('❌ Failed to insert superadmin role:', insertError.message)
        return new Response(JSON.stringify({
          success: false,
          error: insertError.message,
          message: 'Failed to insert superadmin role'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('✅ Superadmin role inserted successfully')
    } catch (error) {
      console.error('❌ Error inserting superadmin role:', error)
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to insert superadmin role'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 2: Verify the setup
    console.log('Verifying setup...')
    try {
      // Check if superadmin role exists
      const { data: roleCheck, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', '6d201176-5be1-45d4-b09f-f70cb4ad38ac')
        .eq('role', 'superadmin')

      // Test RPC function
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('is_superadmin', { _user_id: '6d201176-5be1-45d4-b09f-f70cb4ad38ac' })

      return new Response(JSON.stringify({
        success: true,
        message: 'User roles SQL setup completed successfully',
        verification: {
          superadminRoleExists: roleCheck && roleCheck.length > 0,
          rpcFunctionWorks: rpcTest === true,
          roleData: roleCheck
        },
        ready: (roleCheck && roleCheck.length > 0) && rpcTest === true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('❌ Verification failed:', error)
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        message: 'Setup completed but verification failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('❌ SQL execution failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to execute user roles SQL setup'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})