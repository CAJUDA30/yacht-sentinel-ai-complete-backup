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
    
    console.log('🔧 Creating missing tables and functions directly...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Step 1: Create yacht_access_control table
    console.log('Creating yacht_access_control table...')
    const { error: error1 } = await supabase
      .from('yacht_access_control')
      .select('id')
      .limit(1)
    
    if (error1 && error1.message.includes('does not exist')) {
      // Table doesn't exist, we need to create it via raw SQL
      console.log('Table yacht_access_control does not exist')
    }

    // Step 2: Test if get_user_yacht_access_detailed function exists
    console.log('Testing get_user_yacht_access_detailed function...')
    const { data: functionTest, error: functionError } = await supabase
      .rpc('get_user_yacht_access_detailed')

    if (functionError) {
      console.log('Function error:', functionError.message)
    }

    // Step 3: Check existing tables
    console.log('Checking yacht_profiles table...')
    const { data: yachtData, error: yachtError } = await supabase
      .from('yacht_profiles')
      .select('id')
      .limit(1)

    return new Response(JSON.stringify({
      success: true,
      message: 'Schema analysis complete',
      results: {
        yacht_access_control_exists: !error1,
        yacht_access_control_error: error1?.message || null,
        function_exists: !functionError,
        function_error: functionError?.message || null,
        yacht_profiles_exists: !yachtError,
        yacht_profiles_error: yachtError?.message || null,
        yacht_profiles_count: yachtData?.length || 0
      },
      next_step: 'Use SQL migrations to create missing schema elements'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Schema analysis error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to analyze schema'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})